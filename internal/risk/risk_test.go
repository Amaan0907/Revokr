package risk

import (
	"testing"
	"time"

	"github.com/revokr/revokr/internal/models"
)

func TestEvaluateRisk_PublicAWSCritical(t *testing.T) {
	input := EvaluationInput{
		Provider:        models.ProviderAWS,
		SecretType:      "aws-access-key-id",
		IsPublicRepo:    true,
		IsDefaultBranch: true,
		CommitTime:      time.Now(),
		IsProduction:    true,
		MultiCommitLeak: false,
	}

	result := EvaluateRisk(input)

	if result.Severity != "CRITICAL" {
		t.Errorf("expected CRITICAL severity, got %s", result.Severity)
	}
	if result.Score < 80 {
		t.Errorf("expected score >= 80, got %d", result.Score)
	}
	if len(result.RiskFactors) == 0 {
		t.Errorf("expected non-empty risk factors")
	}
	// Verify JSON structure of first factor
	if result.RiskFactors[0].Points <= 0 || result.RiskFactors[0].Name == "" {
		t.Errorf("expected valid RiskFactor struct with Name and Points")
	}
}
