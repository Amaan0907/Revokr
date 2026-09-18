package risk

import "time"

// RiskFactor drives the explainable-score UI requirement from database-design.md.
// Stored as JSONB in incidents.risk_factors: [{"name": "...", "points": N}, ...].
type RiskFactor struct {
	Name   string `json:"name"`
	Points int    `json:"points"`
}

type EvaluationInput struct {
	Provider        string
	SecretType      string
	IsPublicRepo    bool
	IsDefaultBranch bool
	CommitTime      time.Time
	IsProduction    bool
	MultiCommitLeak bool
}

type RiskResult struct {
	Score       int          `json:"score"`
	Severity    string       `json:"severity"`
	RiskFactors []RiskFactor `json:"risk_factors"`
}

// EvaluateRisk calculates a deterministic score from documented factors.
func EvaluateRisk(input EvaluationInput) RiskResult {
	score := 0
	var factors []RiskFactor

	if input.IsPublicRepo {
		score += 40
		factors = append(factors, RiskFactor{Name: "Exposed in Public Repository", Points: 40})
	} else {
		score += 15
		factors = append(factors, RiskFactor{Name: "Exposed in Private Repository", Points: 15})
	}

	switch input.Provider {
	case "aws":
		score += 30
		factors = append(factors, RiskFactor{Name: "High-Impact Cloud Infrastructure Credential (AWS)", Points: 30})
	case "openai", "stripe":
		score += 25
		factors = append(factors, RiskFactor{Name: "Financial/Quota Impact API Key", Points: 25})
	case "github":
		score += 25
		factors = append(factors, RiskFactor{Name: "Codebase & Deployment Access Token", Points: 25})
	default:
		score += 10
		factors = append(factors, RiskFactor{Name: "Generic Service Credential", Points: 10})
	}

	if input.IsDefaultBranch {
		score += 15
		factors = append(factors, RiskFactor{Name: "Committed directly to default branch", Points: 15})
	}

	if input.IsProduction {
		score += 15
		factors = append(factors, RiskFactor{Name: "Production environment repository flagged", Points: 15})
	}

	timeSinceCommit := time.Since(input.CommitTime)
	if timeSinceCommit < 1*time.Hour {
		score += 10
		factors = append(factors, RiskFactor{Name: "Fresh leak (< 1 hour ago)", Points: 10})
	} else if timeSinceCommit < 24*time.Hour {
		score += 5
		factors = append(factors, RiskFactor{Name: "Recent leak (< 24 hours ago)", Points: 5})
	}

	if input.MultiCommitLeak {
		score += 10
		factors = append(factors, RiskFactor{Name: "Secret detected across multiple commits", Points: 10})
	}

	if score > 100 {
		score = 100
	}

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

	return RiskResult{Score: score, Severity: severity, RiskFactors: factors}
}
