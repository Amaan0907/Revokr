package providers

import (
	"context"

	"github.com/Amaan0907/Revokr/internal/provider"
)

// CredentialInput is the minimal shape needed to select and call an adapter.
// It deliberately doesn't reference internal/incidents.Incident: this
// package must never import internal/incidents, because internal/incidents
// needs to import this package (to call Rotate from its transition/HTTP
// handling) — importing it back here would be a cycle.
type CredentialInput struct {
	Provider    string
	SecretType  string
	MaskedValue string
	ResourceRef string
}

func (c CredentialInput) toCredential() provider.Credential {
	return provider.Credential{
		Provider:    c.Provider,
		SecretType:  c.SecretType,
		MaskedValue: c.MaskedValue,
		ResourceRef: c.ResourceRef,
	}
}

// Rotate calls the adapter selected for isSimulated (see Select) to rotate
// the given credential. It never touches a database or an incident's
// status — recording the outcome (which status to move to, what audit
// entry to write) is the caller's job, via internal/incidents.Transition.
func Rotate(ctx context.Context, isSimulated bool, cred CredentialInput) (provider.RotateResult, error) {
	adapter := Select(isSimulated)
	return adapter.Rotate(ctx, cred.toCredential())
}

// Revoke calls the adapter selected for isSimulated to disable the old
// credential — the "disable old" step of the ordering rule in CLAUDE.md
// (create replacement -> validate -> update destination -> verify ->
// disable old -> verify). Like Rotate, it never touches a database or an
// incident's status.
func Revoke(ctx context.Context, isSimulated bool, cred CredentialInput) (provider.RevokeResult, error) {
	adapter := Select(isSimulated)
	return adapter.Revoke(ctx, cred.toCredential())
}
