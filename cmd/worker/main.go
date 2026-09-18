package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/Amaan0907/Revokr/internal/db"
	"github.com/Amaan0907/Revokr/internal/detector"
	"github.com/Amaan0907/Revokr/internal/incidents"
	"github.com/Amaan0907/Revokr/internal/queue"
	"github.com/Amaan0907/Revokr/internal/risk"
)

func main() {
	// .env only exists in local dev; ECS gets its env vars from the task
	// definition, so a missing file here is expected and not an error.
	_ = godotenv.Load()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("worker: db connect: %v", err)
	}
	defer pool.Close()

	q, err := queue.New(ctx, os.Getenv("SQS_QUEUE_URL"))
	if err != nil {
		log.Fatalf("worker: queue init: %v", err)
	}

	log.Println("worker: polling for jobs")

	for {
		select {
		case <-ctx.Done():
			log.Println("worker: shutting down")
			return
		default:
		}

		messages, err := q.Receive(ctx, 5)
		if err != nil {
			log.Printf("worker: receive error: %v", err)
			continue
		}

		for _, msg := range messages {
			if err := handleJob(ctx, pool, *msg.Body); err != nil {
				log.Printf("worker: handle job error: %v", err)
			}

			if err := q.Delete(ctx, *msg.ReceiptHandle); err != nil {
				log.Printf("worker: delete message error: %v", err)
			}
		}
	}
}

func handleJob(ctx context.Context, pool *pgxpool.Pool, body string) error {
	var job queue.DetectionJob
	if err := json.Unmarshal([]byte(body), &job); err != nil {
		log.Printf("worker: unmarshal job error (non-detection job): %v", err)
		return nil
	}

	log.Printf("worker: processing detection job for %s/%s at commit %s",
		job.RepositoryOwner, job.RepositoryName, job.CommitSHA)

	if job.DiffContent == "" {
		log.Printf("worker: no diff content provided for commit %s, skipping scan", job.CommitSHA)
		return nil
	}

	findings := detector.ScanDiff(job.DiffContent)
	if len(findings) == 0 {
		log.Printf("worker: scan complete - 0 secrets detected in %s/%s",
			job.RepositoryOwner, job.RepositoryName)
		return nil
	}

	repoID, err := incidents.ResolveRepositoryID(ctx, pool, job.RepositoryID, job.RepositoryOwner, job.RepositoryName)
	if err != nil {
		log.Printf("worker: repository resolve note: %v", err)
	}

	filePath := job.FilePath
	if filePath == "" {
		filePath = "diff"
	}

	for _, f := range findings {
		eval := risk.EvaluateRisk(risk.EvaluationInput{
			Provider:        f.Provider,
			SecretType:      f.SecretType,
			IsPublicRepo:    job.IsPublic,
			IsDefaultBranch: true,
			CommitTime:      time.Now(),
		})

		if repoID != "" {
			inc := &incidents.Incident{
				RepositoryID: repoID,
				CommitSHA:    job.CommitSHA,
				FilePath:     filePath,
				LineNumber:   f.LineNumber,
				Provider:     f.Provider,
				SecretType:   f.SecretType,
				Fingerprint:  f.Fingerprint,
				MaskedValue:  f.MaskedValue,
				Severity:     eval.Severity,
				RiskScore:    eval.Score,
				RiskFactors:  eval.RiskFactors,
				Status:       incidents.StatusDetected,
				Simulated:    job.Simulated,
			}

			if err := incidents.Create(ctx, pool, inc); err != nil {
				log.Printf("worker: failed to persist incident: %v", err)
			} else {
				log.Printf("worker: incident stored [id=%s provider=%s masked=%s severity=%s score=%d status=%s]",
					inc.ID, inc.Provider, inc.MaskedValue, inc.Severity, inc.RiskScore, inc.Status)

				// Record initial audit log for detection
				if err := incidents.RecordAuditLog(ctx, pool, &incidents.AuditLog{
					IncidentID: inc.ID,
					Actor:      "worker",
					Action:     incidents.ActionDetected,
					Result:     incidents.ResultSuccess,
					Metadata: map[string]any{
						"file_path":   inc.FilePath,
						"line_number": inc.LineNumber,
						"commit_sha":  inc.CommitSHA,
					},
				}); err != nil {
					log.Printf("worker: audit log recorded for detection warning: %v", err)
				}

				// Record audit log for risk score
				if err := incidents.RecordAuditLog(ctx, pool, &incidents.AuditLog{
					IncidentID: inc.ID,
					Actor:      "risk-engine",
					Action:     incidents.ActionRiskScored,
					Result:     incidents.ResultSuccess,
					Metadata: map[string]any{
						"risk_score":   eval.Score,
						"severity":     eval.Severity,
						"risk_factors": eval.RiskFactors,
					},
				}); err != nil {
					log.Printf("worker: audit log recorded for risk scoring warning: %v", err)
				}

				// Kick off validation immediately — DETECTED -> VALIDATING ->
				// AWAITING_APPROVAL, calling the real or simulated adapter per
				// inc.Simulated (see incidents.PerformValidation). A failure here
				// lands the incident at FAILED with its own audit trail; it's
				// logged, not fatal, so one bad incident doesn't stop the worker.
				if err := incidents.PerformValidation(ctx, pool, inc, "worker"); err != nil {
					log.Printf("worker: validation error for incident %s: %v", inc.ID, err)
				}
			}
		} else {
			// When running locally without populated repo tables, log safely with masked value
			log.Printf("worker: secret detected [provider=%s masked=%s severity=%s score=%d]",
				f.Provider, f.MaskedValue, eval.Severity, eval.Score)
		}
	}

	return nil
}
