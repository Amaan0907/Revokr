package risk

import (
	"testing"
	"time"
)

func TestEvaluateRisk_PublicAWSCritical(t *testing.T) {
	result := EvaluateRisk(EvaluationInput{
		Provider:        "aws",
		SecretType:      "aws-access-key-id",
		IsPublicRepo:    true,
		IsDefaultBranch: true,
		CommitTime:      time.Now(),
		IsProduction:    true,
	})

	if result.Severity != "CRITICAL" {
		t.Errorf("expected CRITICAL severity, got %s", result.Severity)
	}
	if result.Score < 80 {
		t.Errorf("expected score >= 80, got %d", result.Score)
	}
	if len(result.RiskFactors) == 0 {
		t.Error("expected non-empty risk factors")
	}
}

func TestEvaluateRisk_PrivateGenericLow(t *testing.T) {
	result := EvaluateRisk(EvaluationInput{
		Provider:        "generic",
		IsPublicRepo:    false,
		IsDefaultBranch: false,
		CommitTime:      time.Now().Add(-48 * time.Hour),
	})

	if result.Severity != "LOW" {
		t.Errorf("expected LOW severity, got %s", result.Severity)
	}
}
