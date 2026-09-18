package incidents

import (
	"encoding/json"
	"testing"
	"time"
)

func TestAuditLogJSON(t *testing.T) {
	log := AuditLog{
		ID:         "log-1234",
		IncidentID: "inc-5678",
		Actor:      "worker",
		Action:     ActionDetected,
		Result:     ResultSuccess,
		Metadata: map[string]any{
			"file_path": "config.json",
		},
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(log)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	var decoded AuditLog
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}

	if decoded.Actor != "worker" {
		t.Errorf("expected actor worker, got %s", decoded.Actor)
	}
	if decoded.Action != ActionDetected {
		t.Errorf("expected action detected, got %s", decoded.Action)
	}
	if decoded.Result != ResultSuccess {
		t.Errorf("expected result success, got %s", decoded.Result)
	}
}

func TestTransitionValidation(t *testing.T) {
	// Verify allowed transition
	if !StatusDetected.CanTransitionTo(StatusValidating) {
		t.Errorf("expected DETECTED -> VALIDATING to be allowed")
	}

	// Verify disallowed transition
	if StatusDetected.CanTransitionTo(StatusResolved) {
		t.Errorf("expected DETECTED -> RESOLVED to be rejected")
	}

	// Verify approval transition
	if !StatusAwaitingApproval.CanTransitionTo(StatusRotating) {
		t.Errorf("expected AWAITING_APPROVAL -> ROTATING to be allowed")
	}
}
