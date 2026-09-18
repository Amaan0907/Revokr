package simulated

import (
	"context"
	"testing"

	"github.com/Amaan0907/Revokr/internal/provider"
)

func TestNew_SatisfiesProviderAdapter(t *testing.T) {
	var a provider.Adapter = New()
	if a == nil {
		t.Fatal("New() returned a nil Adapter")
	}
}

func TestAdapter_Detect_ReturnsSimulatedCredential(t *testing.T) {
	a := New()

	cred, ok, err := a.Detect(context.Background(), "irrelevant-raw-input")
	if err != nil {
		t.Fatalf("Detect() returned error: %v", err)
	}
	if !ok {
		t.Fatal("Detect() returned ok=false, expected a simulated detection to always succeed")
	}
	if cred.Provider != "simulated" {
		t.Errorf("expected Provider %q, got %q", "simulated", cred.Provider)
	}
}

func TestAdapter_Validate_NeverCallsOutAndReportsSimulated(t *testing.T) {
	a := New()

	result, err := a.Validate(context.Background(), provider.Credential{Provider: "aws"})
	if err != nil {
		t.Fatalf("Validate() returned error: %v", err)
	}
	if !result.IsLive {
		t.Error("expected simulated Validate() to report IsLive=true")
	}
	if result.Detail == "" {
		t.Error("Detail must disclose this was simulated, not empty")
	}
}

func TestAdapter_Revoke_NeverCallsOutAndReportsSimulated(t *testing.T) {
	a := New()

	result, err := a.Revoke(context.Background(), provider.Credential{Provider: "aws"})
	if err != nil {
		t.Fatalf("Revoke() returned error: %v", err)
	}
	if !result.Revoked {
		t.Error("expected simulated Revoke() to report Revoked=true")
	}
	if result.Detail == "" {
		t.Error("Detail must disclose this was simulated, not empty")
	}
}

func TestAdapter_Rotate_NeverEchoesRealRawValue(t *testing.T) {
	a := New()

	realLookingCred := provider.Credential{
		Provider:    "aws",
		ResourceRef: "arn:aws:iam::123456789012:user/leaked-user",
		RawValue:    "AKIA_REAL_LOOKING_VALUE_SHOULD_NEVER_BE_ECHOED",
	}

	result, err := a.Rotate(context.Background(), realLookingCred)
	if err != nil {
		t.Fatalf("Rotate() returned error: %v", err)
	}
	if result.NewRawValue == realLookingCred.RawValue {
		t.Error("Rotate() echoed the input RawValue back unchanged — a simulated adapter must never do this")
	}
	if result.Detail == "" {
		t.Error("Detail must disclose this was simulated, not empty")
	}
}
