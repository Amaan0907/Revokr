package providers

import (
	"context"
	"testing"
)

func TestCredentialInput_ToCredential_MapsFields(t *testing.T) {
	in := CredentialInput{
		Provider:    "aws",
		SecretType:  "aws-access-key-id",
		MaskedValue: "AKIA••••••••MPLE",
		ResourceRef: "fp-123",
	}

	cred := in.toCredential()

	if cred.Provider != in.Provider {
		t.Errorf("Provider = %q, want %q", cred.Provider, in.Provider)
	}
	if cred.SecretType != in.SecretType {
		t.Errorf("SecretType = %q, want %q", cred.SecretType, in.SecretType)
	}
	if cred.MaskedValue != in.MaskedValue {
		t.Errorf("MaskedValue = %q, want %q", cred.MaskedValue, in.MaskedValue)
	}
	if cred.ResourceRef != in.ResourceRef {
		t.Errorf("ResourceRef = %q, want %q", cred.ResourceRef, in.ResourceRef)
	}
	if cred.RawValue != "" {
		t.Error("toCredential must never populate RawValue — CredentialInput never carries a raw secret value")
	}
}

func TestRotate_Simulated_ReturnsFakeResultWithNoError(t *testing.T) {
	result, err := Rotate(context.Background(), true, CredentialInput{Provider: "aws", ResourceRef: "fp-123"})
	if err != nil {
		t.Fatalf("Rotate(simulated) returned error: %v", err)
	}
	if result.NewRawValue == "" {
		t.Error("expected a fake NewRawValue from the simulated adapter")
	}
}
