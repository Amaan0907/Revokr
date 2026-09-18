package bedrock 

import "fmt"

// TemplateAnalyzer is the determinstic fallback Analyzer - no llm call, no
// network, always available. Used when bedrock access isn't wired up yet, or
// as a safety net if the Bedrock call itself fails

type TemplateAnalyzer struct{}

func(TemplateAnalyzer) Analyze(inc SanitizedIncident) (Analysis, error) {
	live:="unknown"

	if inc.IsLive!=nil {
		if *inc.IsLive {
			live="confirmed live"
		}else{
			live="not confirmed live"
		}
	}
	return Analysis{
		Summary: fmt.Sprintf("A %s credential (%s) was detected in %s at %s,status %s.",
		inc.Provider,inc.SecretType,inc.RepositoryName, inc.FilePath, inc.Status),
		WhyItMatters: fmt.Sprintf("Severity is %s (risk score %d) and the credential is %s.",
		inc.Severity, inc.RiskScore, live),
		RecommendedResponse: "Review the incident and approve rotation if the credential is confirmed live.",
		Confidence: 0.4,
		Source:     "template",
	}, nil

}