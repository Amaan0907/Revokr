package detector

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"

	"github.com/revokr/revokr/internal/models"
)

type SecretPattern struct {
	Provider   models.Provider
	SecretType string
	Regex      *regexp.Regexp
}

var patterns = []SecretPattern{
	// AWS Access Key ID: AKIA / ASIA
	{
		Provider:   models.ProviderAWS,
		SecretType: "aws-access-key-id",
		Regex:      regexp.MustCompile(`\b((?:AKIA|ASIA)[0-9A-Z]{16})\b`),
	},
	// GitHub Personal Access Token
	{
		Provider:   models.ProviderGitHub,
		SecretType: "github-pat",
		Regex:      regexp.MustCompile(`\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b`),
	},
	// OpenAI API Key
	{
		Provider:   models.ProviderOpenAI,
		SecretType: "openai-api-key",
		Regex:      regexp.MustCompile(`\b(sk-[a-zA-Z0-9]{48}|sk-proj-[a-zA-Z0-9\-_]{64,})\b`),
	},
	// Stripe Secret Key
	{
		Provider:   models.ProviderStripe,
		SecretType: "stripe-secret-key",
		Regex:      regexp.MustCompile(`\b(sk_live_[0-9a-zA-Z]{24})\b`),
	},
	// Slack Bot Token
	{
		Provider:   models.ProviderSlack,
		SecretType: "slack-bot-token",
		Regex:      regexp.MustCompile(`\b(xoxb-[0-9]{11,12}-[0-9]{11,12}-[a-zA-Z0-9]{24})\b`),
	},
}

type Finding struct {
	Provider    models.Provider
	SecretType  string
	MaskedValue string
	Fingerprint string
	LineNumber  int
}

// MaskSecret enforces the cross-cutting rule: e.g. AKIA••••••••••••1F2C
// Raw secrets NEVER reach logs, database, or Bedrock prompts!
func MaskSecret(secret string) string {
	if len(secret) <= 8 {
		return "••••••••"
	}
	prefix := secret[:4]
	suffix := secret[len(secret)-4:]
	maskedMiddle := strings.Repeat("•", len(secret)-8)
	return fmt.Sprintf("%s%s%s", prefix, maskedMiddle, suffix)
}

// GenerateFingerprint returns a safe SHA256 hex hash of the raw credential for deduplication
func GenerateFingerprint(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// ScanDiff scans a commit diff line-by-line and returns structured findings
func ScanDiff(diffContent string) []Finding {
	lines := strings.Split(diffContent, "\n")
	var findings []Finding

	for lineIdx, line := range lines {
		cleanLine := strings.TrimPrefix(line, "+")

		for _, p := range patterns {
			matches := p.Regex.FindAllString(cleanLine, -1)
			for _, match := range matches {
				findings = append(findings, Finding{
					Provider:    p.Provider,
					SecretType:  p.SecretType,
					MaskedValue: MaskSecret(match),
					Fingerprint: GenerateFingerprint(match),
					LineNumber:  lineIdx + 1,
				})
			}
		}
	}

	return findings
}
