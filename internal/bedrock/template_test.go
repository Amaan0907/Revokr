package bedrock

import (
	
	"testing"
	"strings"
)

func TestTemplateAnalyzer_SatisfiesAnalyzer( t *testing.T) {
	var _ Analyzer = TemplateAnalyzer{}
}

func TestTemplateAnalyzer_DiscloseSource(t *testing.T) {
	inc:= SanitizedIncident{
		Provider:  "aws",
		SecretType: "aws-access-key-id",
		Severity:   "CRITICAL",
		RiskScore:	90,
		Status:			"Detected",

	}
	got,err :=TemplateAnalyzer{}.Analyze(inc)

	if err!=nil {
		t.Fatalf("Analyze() returned error: %v", err)
	}

	if got.Source !="template" {
		t.Errorf("Source=%q, want %q", got.Source, "template")

	}

}

func TestTemplateAnalyzer_HandlesUnkownIsLive(t *testing.T) {
	
	inc:= SanitizedIncident{
		Provider: "openai",
		Severity: "HIGH",
		Status:   "DETECTED",
		IsLive:   nil,
	}

	got, err := TemplateAnalyzer{}.Analyze(inc)
	if err != nil {
		t.Fatalf("Analyze() returned error: %v", err)
	}

	if !strings.Contains(got.WhyItMatters, "unknown") {
		t.Errorf("WhyItMatters=%q,want it to mention the live status is unknown", got.WhyItMatters)
	}
}