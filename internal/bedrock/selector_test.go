package bedrock
import "testing"

func TestNewAnalyzer_ReturnsWorkingAnalyzer(t *testing.T) {
	analyzer:=NewAnalyzer()

	inc:=SanitizedIncident{
		Provider: "aws",
		Severity: "CRITICAL",
		Status:   "DETECTED",
	}

	got, err :=analyzer.Analyze(inc)

	if err!=nil {
		t.Fatalf("Analyze() returned error: %v", err)
	}

	if got.Source=="" {
		t.Error("Analysis.Source is emoty - caller has no way to know where this came from")
	}
}