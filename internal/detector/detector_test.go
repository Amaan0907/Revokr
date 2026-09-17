package detector

import (
	"testing"

	"github.com/revokr/revokr/internal/models"
)

func TestScanDiff(t *testing.T) {
	diff := `
+ export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
+ export GITHUB_TOKEN=ghp_123456789012345678901234567890123456
+ const normalCode = true;
`

	findings := ScanDiff(diff)
	if len(findings) != 2 {
		t.Fatalf("expected 2 findings, got %d", len(findings))
	}

	awsFinding := findings[0]
	if awsFinding.Provider != models.ProviderAWS {
		t.Errorf("expected provider aws, got %s", awsFinding.Provider)
	}
	if awsFinding.MaskedValue != "AKIA••••••••••••MPLE" {
		t.Errorf("expected masked value AKIA••••••••••••MPLE, got %s", awsFinding.MaskedValue)
	}

	ghFinding := findings[1]
	if ghFinding.Provider != models.ProviderGitHub {
		t.Errorf("expected provider github, got %s", ghFinding.Provider)
	}
}
