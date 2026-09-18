package statemachine

import (
	"fmt"
	"time"

	"github.com/revokr/revokr/internal/models"
)

// AllowedTransitions defines valid state movements
var allowedTransitions = map[models.IncidentStatus][]models.IncidentStatus{
	models.StatusDetected: {
		models.StatusValidating,
		models.StatusFailed,
		models.StatusNotSupported,
	},
	models.StatusValidating: {
		models.StatusAwaitingApproval,
		models.StatusFailed,
		models.StatusRequiresUserAction,
	},
	models.StatusAwaitingApproval: {
		models.StatusRotating,
		models.StatusResolved,
		models.StatusRequiresUserAction,
	},
	models.StatusRotating: {
		models.StatusVerifying,
		models.StatusFailed,
		models.StatusRequiresUserAction,
	},
	models.StatusVerifying: {
		models.StatusResolved,
		models.StatusFailed,
		models.StatusRequiresUserAction,
	},
}

// Transition moves an incident to target state and outputs an audit log matching database-design.md
func Transition(incident *models.Incident, target models.IncidentStatus, actor, action, result string, metadata map[string]any) (*models.AuditLog, error) {
	validTargets, exists := allowedTransitions[incident.Status]
	if !exists {
		return nil, fmt.Errorf("no transitions defined from state %s", incident.Status)
	}

	allowed := false
	for _, v := range validTargets {
		if v == target {
			allowed = true
			break
		}
	}

	if !allowed {
		return nil, fmt.Errorf("invalid transition from %s to %s", incident.Status, target)
	}

	prevStatus := incident.Status
	incident.Status = target
	now := time.Now().UTC()

	if target == models.StatusResolved {
		incident.ResolvedAt = &now
	}

	if metadata == nil {
		metadata = make(map[string]any)
	}
	metadata["from_status"] = prevStatus
	metadata["to_status"] = target

	audit := &models.AuditLog{
		ID:         fmt.Sprintf("audit_%d", now.UnixNano()),
		IncidentID: incident.ID,
		Actor:      actor,
		Action:     action,
		Result:     result,
		Metadata:   metadata,
		Timestamp:  now,
	}

	return audit, nil
}
