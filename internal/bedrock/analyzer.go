package bedrock
// Analysis is what the AI Incident Analyst produces for one incident.
type Analysis struct {
	Summary             string  `json:"summary"`
	WhyItMatters        string  `json:"whyItMatters"`
	RecommendedResponse string  `json:"recommendedResponse"`
	Confidence          float64 `json:"confidence"` // 0.0-1.0
	Source              string  `json:"source"`     // "openai" or "template" - the UI must show it, never hide it
}

// Analyzer turns a santized incident into an Analysis.
// dashboard can call one thing regardless of whether bedrock is wired up
// yet - a template based Analyzer and a bedrock- backed analyzer both satisfy
// This interface

type Analyzer interface {
	Analyze(inc SanitizedIncident) (Analysis, error)
}