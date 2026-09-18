package providers

import (
	"testing"

	"github.com/Amaan0907/Revokr/internal/incidents"
)

func TestCredentialFromIncident_MapsFields(t *testing.T) {
	inc := &incidents.Incident{
		Provider:    "aws",
		SecretType:  "aws-access-key-id",
		MaskedValue: "AKIA••••••••MPLE",
		Fingerprint: "fp-123",
	}

	cred := credentialFromIncident(inc)

	if cred.Provider != inc.Provider {
		t.Errorf("Provider = %q, want %q", cred.Provider, inc.Provider)
	}
	if cred.SecretType != inc.SecretType {
		t.Errorf("SecretType = %q, want %q", cred.SecretType, inc.SecretType)
	}
	if cred.MaskedValue != inc.MaskedValue {
		t.Errorf("MaskedValue = %q, want %q", cred.MaskedValue, inc.MaskedValue)
	}
	if cred.ResourceRef != inc.Fingerprint {
		t.Errorf("ResourceRef = %q, want incident Fingerprint %q", cred.ResourceRef, inc.Fingerprint)
	}
	if cred.RawValue != "" {
		t.Error("credentialFromIncident must never populate RawValue — Incident never carries a raw secret value")
	}
}
