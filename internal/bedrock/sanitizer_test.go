package bedrock

import (
	"fmt"
	"reflect"
	"strings"
	"testing"
)

func TestSanitizeIncident_StripsRawSecret(t *testing.T) {
	const rawSecret = "AKIAABCDEFGHIJKLMNOP-DO-NOT-LEAK"

	inc := Incident{
		Provider:       "aws",
		SecretType:     "aws-access-key-id",
		Fingerprint:    "f-1234",
		MaskedValue:    "AKIA••••••••••••1F2C",
		RawSecretValue: rawSecret,
		Severity:       "CRITICAL",
		RiskScore:      92,
		Status:         "DETECTED",
		FilePath:       "config/deploy.sh",
		LineNumber:     14,
		CommitSHA:      "abc123",
	}

	got := SanitizeIncident(inc)

	dump := fmt.Sprintf("%+v", got)
	if strings.Contains(dump, rawSecret) {
		t.Fatalf("sanitized incident leaked the raw secret value: %s", dump)
	}
}

func TestSanitizeIncident_CarriesWhitelistedFields(t *testing.T) {
	live := true
	inc := Incident{
		Provider:        "openai",
		SecretType:      "openai-api-key",
		Fingerprint:     "f-5678",
		MaskedValue:     "sk-••••••••wxyz",
		RawSecretValue:  "sk-thisIsTheRealSecretValue",
		IsLive:          &live,
		Severity:        "HIGH",
		RiskScore:       70,
		RiskFactors:     []RiskFactor{{Name: "no rotation history", Points: 20}},
		Status:          "AWAITING_APPROVAL",
		Simulated:       true,
		RepositoryOwner: "acme",
		RepositoryName:  "ml-pipelines",
		FilePath:        "notebooks/train.py",
		LineNumber:      8,
		CommitSHA:       "def456",
	}

	want := SanitizedIncident{
		Provider:        "openai",
		SecretType:      "openai-api-key",
		Fingerprint:     "f-5678",
		MaskedValue:     "sk-••••••••wxyz",
		IsLive:          &live,
		Severity:        "HIGH",
		RiskScore:       70,
		RiskFactors:     []RiskFactor{{Name: "no rotation history", Points: 20}},
		Status:          "AWAITING_APPROVAL",
		Simulated:       true,
		RepositoryOwner: "acme",
		RepositoryName:  "ml-pipelines",
		FilePath:        "notebooks/train.py",
		LineNumber:      8,
		CommitSHA:       "def456",
	}

	got := SanitizeIncident(inc)

	if !reflect.DeepEqual(got, want) {
		t.Errorf("SanitizeIncident() = %+v, want %+v", got, want)
	}
}
