package bedrock

// NewAnalyzer returns the Analyzer the rest of the app should use.
//
// Callers never construct an Analyzer themselves — this is the only place
// that changes when the backing implementation changes, so nothing else in
// the codebase needs to know OpenAI is involved, let alone whether it's
// currently reachable.


func NewAnalyzer() Analyzer {
	return NewOpenAIAnalyzer()
}