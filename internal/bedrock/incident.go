// Package bedrock builds the AI Incident Analyst prompt for Amazon Bedrock.
// It never receives a raw credential value or file contents — only whatever
// SanitizeIncident lets through.
package bedrock

// RiskFactor mirrors one entry of incidents.risk_factors.
type RiskFactor struct {
	Name   string
	Points int
}

// Incident is the internal, full-detail view of a row from the incidents
// table, plus any transient fields the scanner/masking pipeline may carry
// before a value is masked. RawSecretValue must never exist past the masking
// step in production, but the type allows for it so SanitizeIncident has
// something concrete to prove it strips.
type Incident struct {
	Provider        string
	SecretType      string
	Fingerprint     string
	MaskedValue     string
	RawSecretValue  string
	IsLive          *bool
	Severity        string
	RiskScore       int
	RiskFactors     []RiskFactor
	Status          string
	Simulated       bool
	RepositoryOwner string
	RepositoryName  string
	FilePath        string
	LineNumber      int
	CommitSHA       string
}

// SanitizedIncident is the only shape that may reach a Bedrock prompt. It has
// no field capable of holding a raw secret value or file contents — that's
// enforced by the type, not by convention.
type SanitizedIncident struct {
	Provider        string
	SecretType      string
	Fingerprint     string
	MaskedValue     string
	IsLive          *bool
	Severity        string
	RiskScore       int
	RiskFactors     []RiskFactor
	Status          string
	Simulated       bool
	RepositoryOwner string
	RepositoryName  string
	FilePath        string
	LineNumber      int
	CommitSHA       string
}
