package bedrock
// Analysis is what the AI Incident Analyst produces for one incident.
type Analysis struct {

	
	Summary 		 				string
	WhyItMatters 				string
	RecommendedResponse string
	Confidence 					float64 // 0.0-1.0
	Source 							string // "openai" or "template" the ui must hsow it never hide it

}

// Analyzer turns a santized incident into an Analysis.
// dashboard can call one thing regardless of whether bedrock is wired up
// yet - a template based Analyzer and a bedrock- backed analyzer both satisfy
// This interface

type Analyzer interface {
	Analyze(inc SanitizedIncident) (Analysis, error)
}