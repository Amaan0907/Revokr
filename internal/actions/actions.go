package actions

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Type string

const (
	TypeValidateCredential   Type = "VALIDATE_CREDENTIAL"
	TypeRotateCredential     Type = "ROTATE_CREDENTIAL"
	TypeUpdateGithubSecret   Type = "UPDATE_GITHUB_SECRET"
	TypeDisableOldCredential Type = "DISABLE_OLD_CREDENTIAL"
	TypeSendNotification     Type = "SEND_NOTIFICATION"
	TypeCleanHistory         Type = "CLEAN_HISTORY"
)

type Status string

const (
	StatusPending   Status = "PENDING"
	StatusRunning   Status = "RUNNING"
	StatusSucceeded Status = "SUCCEEDED"
	StatusFailed    Status = "FAILED"
)

// Action mirrors a row in the PostgreSQL actions table — one per remediation
// step, so the dashboard's checklist reflects what actually happened rather
// than the incident's single overall status.
type Action struct {
	ID             string     `json:"id"`
	IncidentID     string     `json:"incident_id"`
	ActionType     Type       `json:"action_type"`
	Status         Status     `json:"status"`
	IdempotencyKey string     `json:"-"`
	Error          *string    `json:"error,omitempty"`
	StartedAt      *time.Time `json:"started_at,omitempty"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
}

// IdempotencyKey is incidentID+actionType, matching the SQS job's own dedupe
// key so a redelivered message and a retried row mean the same job. attempt
// is appended only when the same action legitimately needs to rerun, e.g.
// retrying a previously FAILED action.
func IdempotencyKey(incidentID string, actionType Type, attempt int) string {
	if attempt <= 1 {
		return fmt.Sprintf("%s:%s", incidentID, actionType)
	}
	return fmt.Sprintf("%s:%s:attempt-%d", incidentID, actionType, attempt)
}

// Start records a remediation step beginning to run, and returns its row.
// Safe to call more than once for the same incident+type+attempt (e.g. a
// redelivered job): the idempotency key means a repeat call resets the same
// row back to RUNNING instead of creating a duplicate. No caller retries a
// failed step yet — everything today passes attempt 1 — so attempt exists
// only so a future retry feature has somewhere to plug in without a schema
// change.
func Start(ctx context.Context, pool *pgxpool.Pool, incidentID string, actionType Type, attempt int) (*Action, error) {
	key := IdempotencyKey(incidentID, actionType, attempt)
	now := time.Now()

	act := &Action{
		IncidentID:     incidentID,
		ActionType:     actionType,
		Status:         StatusRunning,
		IdempotencyKey: key,
		StartedAt:      &now,
	}

	query := `
		INSERT INTO actions (incident_id, action_type, status, idempotency_key, started_at)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (idempotency_key) DO UPDATE SET
			status = EXCLUDED.status,
			started_at = EXCLUDED.started_at,
			error = NULL,
			completed_at = NULL
		RETURNING id;
	`
	if err := pool.QueryRow(ctx, query, incidentID, string(actionType), string(StatusRunning), key, now).Scan(&act.ID); err != nil {
		return nil, fmt.Errorf("actions: start %s for incident %s: %w", actionType, incidentID, err)
	}
	return act, nil
}

// Succeed marks a running action complete.
func Succeed(ctx context.Context, pool *pgxpool.Pool, id string) error {
	now := time.Now()
	_, err := pool.Exec(ctx,
		"UPDATE actions SET status = $1, completed_at = $2, error = NULL WHERE id = $3",
		string(StatusSucceeded), now, id,
	)
	if err != nil {
		return fmt.Errorf("actions: mark %s succeeded: %w", id, err)
	}
	return nil
}

// Fail marks a running action failed and records why. It never retries on
// its own — the caller (internal/incidents) decides what happens next, per
// the "no silent retries" rule.
func Fail(ctx context.Context, pool *pgxpool.Pool, id, errMsg string) error {
	now := time.Now()
	_, err := pool.Exec(ctx,
		"UPDATE actions SET status = $1, completed_at = $2, error = $3 WHERE id = $4",
		string(StatusFailed), now, errMsg, id,
	)
	if err != nil {
		return fmt.Errorf("actions: mark %s failed: %w", id, err)
	}
	return nil
}

// ListByIncident returns every remediation step recorded for an incident,
// oldest first — the shape the dashboard's remediation checklist needs.
func ListByIncident(ctx context.Context, pool *pgxpool.Pool, incidentID string) ([]Action, error) {
	query := `
		SELECT id, incident_id, action_type, status, idempotency_key, error, started_at, completed_at
		FROM actions
		WHERE incident_id = $1
		ORDER BY started_at ASC NULLS LAST;
	`
	rows, err := pool.Query(ctx, query, incidentID)
	if err != nil {
		return nil, fmt.Errorf("actions: list for incident %s: %w", incidentID, err)
	}
	defer rows.Close()

	var results []Action
	for rows.Next() {
		var a Action
		var actionTypeStr, statusStr string
		if err := rows.Scan(
			&a.ID, &a.IncidentID, &actionTypeStr, &statusStr, &a.IdempotencyKey,
			&a.Error, &a.StartedAt, &a.CompletedAt,
		); err != nil {
			return nil, fmt.Errorf("actions: scan row: %w", err)
		}
		a.ActionType = Type(actionTypeStr)
		a.Status = Status(statusStr)
		results = append(results, a)
	}
	return results, nil
}
