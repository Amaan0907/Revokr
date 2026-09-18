package incidents

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditAction string

const (
	ActionDetected        AuditAction = "detected"
	ActionValidated       AuditAction = "validated"
	ActionRiskScored      AuditAction = "risk_scored"
	ActionAuthRequested   AuditAction = "auth_requested"
	ActionApproved        AuditAction = "approved"
	ActionDenied          AuditAction = "denied"
	ActionKeyCreated      AuditAction = "key_created"
	ActionOldKeyDisabled  AuditAction = "old_key_disabled"
	ActionGHSecretUpdated AuditAction = "gh_secret_updated"
	ActionVerified        AuditAction = "verified"
	ActionResolved        AuditAction = "resolved"
	ActionFailed          AuditAction = "failed"
)

type AuditResult string

const (
	ResultSuccess AuditResult = "success"
	ResultFailure AuditResult = "failure"
	ResultPending AuditResult = "pending"
)

type AuditLog struct {
	ID         string      `json:"id"`
	IncidentID string      `json:"incident_id"`
	UserID     *string     `json:"user_id,omitempty"`
	Actor      string      `json:"actor"`
	Action     AuditAction `json:"action"`
	Result     AuditResult `json:"result"`
	Metadata   any         `json:"metadata,omitempty"`
	Timestamp  time.Time   `json:"timestamp"`
}

// RecordAuditLog inserts an audit log entry for an incident.
func RecordAuditLog(ctx context.Context, pool *pgxpool.Pool, log *AuditLog) error {
	metaJSON, err := json.Marshal(log.Metadata)
	if err != nil {
		return fmt.Errorf("marshal audit metadata: %w", err)
	}

	query := `
		INSERT INTO audit_logs (
			incident_id, user_id, actor, action, result, metadata
		) VALUES (
			$1, $2, $3, $4, $5, $6
		) RETURNING id, timestamp;
	`

	return pool.QueryRow(ctx, query,
		log.IncidentID,
		log.UserID,
		log.Actor,
		string(log.Action),
		string(log.Result),
		metaJSON,
	).Scan(&log.ID, &log.Timestamp)
}

// GetAuditLogs returns chronological audit history for an incident.
func GetAuditLogs(ctx context.Context, pool *pgxpool.Pool, incidentID string) ([]AuditLog, error) {
	query := `
		SELECT id, incident_id, user_id, actor, action, result, metadata, timestamp
		FROM audit_logs
		WHERE incident_id = $1
		ORDER BY timestamp ASC;
	`
	rows, err := pool.Query(ctx, query, incidentID)
	if err != nil {
		return nil, fmt.Errorf("query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var l AuditLog
		var metaRaw []byte
		var actionStr, resultStr string
		if err := rows.Scan(&l.ID, &l.IncidentID, &l.UserID, &l.Actor, &actionStr, &resultStr, &metaRaw, &l.Timestamp); err != nil {
			return nil, fmt.Errorf("scan audit log: %w", err)
		}
		l.Action = AuditAction(actionStr)
		l.Result = AuditResult(resultStr)
		if len(metaRaw) > 0 {
			var m any
			_ = json.Unmarshal(metaRaw, &m)
			l.Metadata = m
		}
		logs = append(logs, l)
	}
	return logs, nil
}
