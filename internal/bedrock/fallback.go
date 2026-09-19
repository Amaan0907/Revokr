package bedrock

// FallbackAnalyzer tries Primary first and, if it returns an error, falls
// back to Fallback instead of propagating the error. This is what makes the
// "degrade to template, disclose Source honestly" rule from CLAUDE.md real:
// without it, an OpenAI outage or missing API key would surface as a bare
// error to whatever calls Analyze, with no fallback attempted.
type FallbackAnalyzer struct {
	Primary  Analyzer
	Fallback Analyzer
}

func (f FallbackAnalyzer) Analyze(inc SanitizedIncident) (Analysis, error) {
	result, err := f.Primary.Analyze(inc)
	if err == nil {
		return result, nil
	}
	return f.Fallback.Analyze(inc)
}
