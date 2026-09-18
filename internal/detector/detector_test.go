package detector

import "testing"

func TestScanDiff_DetectsAWSAndGitHub(t *testing.T) {
	diff := `
+ export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
+ export GITHUB_TOKEN=ghp_123456789012345678901234567890123456
+ const normalCode = true;
`

	findings := ScanDiff(diff)
	if len(findings) != 2 {
		t.Fatalf("expected 2 findings, got %d", len(findings))
	}

	if findings[0].Provider != "aws" {
		t.Errorf("expected provider aws, got %s", findings[0].Provider)
	}
	if findings[0].MaskedValue != "AKIA••••••••••••MPLE" {
		t.Errorf("expected masked AKIA••••••••••••MPLE, got %s", findings[0].MaskedValue)
	}

	if findings[1].Provider != "github" {
		t.Errorf("expected provider github, got %s", findings[1].Provider)
	}
}

func TestScanDiff_NoSecrets(t *testing.T) {
	diff := `
+ const x = 42;
+ func main() {}
`
	findings := ScanDiff(diff)
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings, got %d", len(findings))
	}
}

func TestMaskSecret(t *testing.T) {
	cases := []struct {
		input, want string
	}{
		{"AKIAIOSFODNN7EXAMPLE", "AKIA••••••••••••MPLE"},
		{"short", "••••••••"},
	}
	for _, c := range cases {
		got := MaskSecret(c.input)
		if got != c.want {
			t.Errorf("MaskSecret(%q) = %q, want %q", c.input, got, c.want)
		}
	}
}
