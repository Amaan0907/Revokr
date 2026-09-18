package bedrock
import (
	"testing"
	"os"
)



func TestNewAnalyzer_ReturnsWorkingAnalyzer(t *testing.T) {

	if os.Getenv("OPENAI_API_KEY")=="" {
	t.Skip("OPENAI_API_KEY not set - skipping live analyzer check")
}
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