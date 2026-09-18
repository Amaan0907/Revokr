package bedrock

// NewAnalyzer returns the Analyzer the rest of the app should use.
//
// It always returns the template fallback for now, because the real
// Bedrock backed Analyzer doesn't exist yet.Once it does,this function
// is the only place that changes -callers never construct an Analyzer
// themselves, so nothing else in the codebase needs to know bedrock exists,
// let alone whether it's currently reachable.

func NewAnalyzer() Analyzer {
	return TemplateAnalyzer{}
}