package models

import "time"

// IncidentStatus represents the state machine status
type IncidentStatus string

const (
	StatusDetected           IncidentStatus = "DETECTED"
	StatusValidating         IncidentStatus = "VALIDATING"
	StatusAwaitingApproval   IncidentStatus = "AWAITING_APPROVAL"
	StatusRotating           IncidentStatus = "ROTATING"
	StatusVerifying          IncidentStatus = "VERIFYING"
	StatusResolved           IncidentStatus = "RESOLVED"
	StatusFailed             IncidentStatus = "FAILED"
	StatusRequiresUserAction IncidentStatus = "REQUIRES_USER_ACTION"
	StatusNotSupported       IncidentStatus = "NOT_SUPPORTED"
)

// Provider represents the secret provider
type Provider string

const (
	ProviderAWS     Provider = "aws"
	ProviderGitHub  Provider = "github"
	ProviderOpenAI  Provider = "openai"
	ProviderGCP     Provider = "gcp"
	ProviderStripe  Provider = "stripe"
	ProviderSlack   Provider = "slack"
	ProviderGeneric Provider = "generic"
)

// RiskFactor represents an explainable factor driving the risk score
type RiskFactor struct {
	Name   string `json:"name"`
	Points int    `json:"points"`
}

// Incident matches the exact RDS schema from database-design.md
type Incident struct {
	ID           string         `json:"id"`
	RepositoryID string         `json:"repository_id"`
	CommitSHA    string         `json:"commit_sha"`
	FilePath     string         `json:"file_path"`
	LineNumber   int            `json:"line_number"`
	Provider     Provider       `json:"provider"`
	SecretType   string         `json:"secret_type"`
	Fingerprint  string         `json:"fingerprint"`
	MaskedValue  string         `json:"masked_value"`
	IsLive       *bool          `json:"is_live,omitempty"`
	Severity     string         `json:"severity"`   // LOW | MEDIUM | HIGH | CRITICAL
	RiskScore    int            `json:"risk_score"` // 0 - 100
	RiskFactors  []RiskFactor   `json:"risk_factors"`
	Status       IncidentStatus `json:"status"`
	Simulated    bool           `json:"simulated"`
	CreatedAt    time.Time      `json:"created_at"`
	ResolvedAt   *time.Time     `json:"resolved_at,omitempty"`
}

// AuditLog matches the audit_logs RDS schema
type AuditLog struct {
	ID         string         `json:"id"`
	IncidentID string         `json:"incident_id"`
	UserID     *string        `json:"user_id,omitempty"`
	Actor      string         `json:"actor"` // 'system' or username
	Action     string         `json:"action"`
	Result     string         `json:"result"` // 'success' | 'failure' | 'pending'
	Metadata   map[string]any `json:"metadata,omitempty"`
	Timestamp  time.Time      `json:"timestamp"`
}
