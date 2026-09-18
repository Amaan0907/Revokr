package risk

import (
	"time"

	"github.com/revokr/revokr/internal/models"
)

type EvaluationInput struct {
	Provider        models.Provider
	SecretType      string
	IsPublicRepo    bool
	IsDefaultBranch bool
	CommitTime      time.Time
	IsProduction    bool
	MultiCommitLeak bool
	IsLive          *bool
}

type RiskResult struct {
	Score       int                 `json:"score"`
	Severity    string              `json:"severity"` // LOW | MEDIUM | HIGH | CRITICAL
	RiskFactors []models.RiskFactor `json:"risk_factors"`
}

// EvaluateRisk calculates a deterministic score matching database-design.md
func EvaluateRisk(input EvaluationInput) RiskResult {
	score := 0
	var factors []models.RiskFactor

	// 1. Repo Visibility (Base exposure)
	if input.IsPublicRepo {
		score += 40
		factors = append(factors, models.RiskFactor{Name: "Exposed in Public Repository", Points: 40})
	} else {
		score += 15
		factors = append(factors, models.RiskFactor{Name: "Exposed in Private Repository", Points: 15})
	}

	// 2. Provider Criticality
	switch input.Provider {
	case models.ProviderAWS:
		score += 30
		factors = append(factors, models.RiskFactor{Name: "High-Impact Cloud Infrastructure Credential (AWS)", Points: 30})
	case models.ProviderOpenAI, models.ProviderStripe:
		score += 25
		factors = append(factors, models.RiskFactor{Name: "Financial/Quota Impact API Key", Points: 25})
	case models.ProviderGitHub:
		score += 25
		factors = append(factors, models.RiskFactor{Name: "Codebase & Deployment Access Token", Points: 25})
	default:
		score += 10
		factors = append(factors, models.RiskFactor{Name: "Generic Service Credential", Points: 10})
	}

	// 3. Branch Impact
	if input.IsDefaultBranch {
		score += 15
		factors = append(factors, models.RiskFactor{Name: "Committed directly to default branch", Points: 15})
	}

	// 4. Production Flag
	if input.IsProduction {
		score += 15
		factors = append(factors, models.RiskFactor{Name: "Production environment repository flagged", Points: 15})
	}

	// 5. Commit Recency
	timeSinceCommit := time.Since(input.CommitTime)
	if timeSinceCommit < 1*time.Hour {
		score += 10
		factors = append(factors, models.RiskFactor{Name: "Fresh leak (< 1 hour ago)", Points: 10})
	} else if timeSinceCommit < 24*time.Hour {
		score += 5
		factors = append(factors, models.RiskFactor{Name: "Recent leak (< 24 hours ago)", Points: 5})
	}

	// 6. Multi-commit appearance
	if input.MultiCommitLeak {
		score += 10
		factors = append(factors, models.RiskFactor{Name: "Secret detected across multiple commits", Points: 10})
	}

	// Cap score at 100
	if score > 100 {
		score = 100
	}

	// Determine Severity strictly from score
	var severity string
	switch {
	case score >= 80:
		severity = "CRITICAL"
	case score >= 60:
		severity = "HIGH"
	case score >= 40:
		severity = "MEDIUM"
	default:
		severity = "LOW"
	}

	return RiskResult{
		Score:       score,
		Severity:    severity,
		RiskFactors: factors,
	}
}
