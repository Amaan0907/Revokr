package incidents

import (
	"encoding/json"
	"testing"
)

func TestValidTransitions(t *testing.T) {
	if !StatusDetected.CanTransitionTo(StatusValidating) {
		t.Errorf("expected DETECTED -> VALIDATING to be valid")
	}
	if !StatusValidating.CanTransitionTo(StatusAwaitingApproval) {
		t.Errorf("expected VALIDATING -> AWAITING_APPROVAL to be valid")
	}
	if StatusDetected.CanTransitionTo(StatusResolved) {
		t.Errorf("expected DETECTED -> RESOLVED to be invalid")
	}
}

func TestIncidentJSON(t *testing.T) {
	inc := Incident{
		RepositoryID: "11111111-1111-1111-1111-111111111111",
		CommitSHA:    "abc12345",
		Provider:     "aws",
		SecretType:   "aws-access-key-id",
		MaskedValue:  "AKIA••••••••MPLE",
		Severity:     "CRITICAL",
		RiskScore:    90,
		Status:       StatusDetected,
	}

	data, err := json.Marshal(inc)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	var decoded Incident
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}

	if decoded.Provider != inc.Provider {
		t.Errorf("expected provider %s, got %s", inc.Provider, decoded.Provider)
	}
	if decoded.Severity != "CRITICAL" {
		t.Errorf("expected severity CRITICAL, got %s", decoded.Severity)
	}
}
