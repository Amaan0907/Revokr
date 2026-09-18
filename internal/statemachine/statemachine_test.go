package statemachine

import (
	"testing"

	"github.com/revokr/revokr/internal/models"
)

func TestTransition_Valid(t *testing.T) {
	inc := &models.Incident{
		ID:     "inc_123",
		Status: models.StatusDetected,
	}

	audit, err := Transition(inc, models.StatusValidating, "system", "validate", "pending", nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if inc.Status != models.StatusValidating {
		t.Errorf("expected status VALIDATING, got %s", inc.Status)
	}
	if audit.IncidentID != "inc_123" {
		t.Errorf("expected incident id inc_123, got %s", audit.IncidentID)
	}
}

func TestTransition_Invalid(t *testing.T) {
	inc := &models.Incident{
		ID:     "inc_123",
		Status: models.StatusDetected,
	}

	// Cannot jump from DETECTED directly to RESOLVED
	_, err := Transition(inc, models.StatusResolved, "system", "resolve", "success", nil)
	if err == nil {
		t.Fatalf("expected error for illegal transition, got nil")
	}
}
