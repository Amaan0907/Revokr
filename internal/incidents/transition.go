package incidents

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Transition validates the requested state change against validTransitions,
// updates the incident status, and appends a corresponding audit_logs entry.
func Transition(ctx context.Context, pool *pgxpool.Pool, incidentID string, target Status, actor string, action AuditAction, metadata any) error {
	var currentStatusStr string
	err := pool.QueryRow(ctx, "SELECT status FROM incidents WHERE id = $1", incidentID).Scan(&currentStatusStr)
	if err != nil {
		return fmt.Errorf("fetch incident status: %w", err)
	}

	currentStatus := Status(currentStatusStr)
	if !currentStatus.CanTransitionTo(target) {
		return fmt.Errorf("invalid status transition: cannot move from %s to %s", currentStatus, target)
	}

	var resolvedAt *time.Time
	if target == StatusResolved {
		now := time.Now()
		resolvedAt = &now
	}

	_, err = pool.Exec(ctx,
		"UPDATE incidents SET status = $1, resolved_at = COALESCE($2, resolved_at) WHERE id = $3",
		string(target), resolvedAt, incidentID,
	)
	if err != nil {
		return fmt.Errorf("update incident status: %w", err)
	}

	audit := &AuditLog{
		IncidentID: incidentID,
		Actor:      actor,
		Action:     action,
		Result:     ResultSuccess,
		Metadata:   metadata,
	}
	if err := RecordAuditLog(ctx, pool, audit); err != nil {
		return fmt.Errorf("record transition audit log: %w", err)
	}

	return nil
}
