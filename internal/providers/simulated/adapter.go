// Package simulated implements provider.Adapter with zero real provider
// calls. It exists so Simulation Mode is a structurally separate code path
// (per CLAUDE.md's non-negotiable rule), not a config flag layered on top of
// the real AWS adapter — nothing in this package can reach a live credential,
// because nothing in it imports an AWS/HTTP client at all.
package simulated

import (
	"context"
	"fmt"

	"github.com/Amaan0907/Revokr/internal/provider"
)

type Adapter struct{}

func New() *Adapter {
	return &Adapter{}
}

// Detect never inspects raw for a real secret shape — the real scanner
// (internal/detector) already did that before an incident ever reaches an
// adapter. This exists only to satisfy provider.Adapter.
func (a *Adapter) Detect(ctx context.Context, raw string) (provider.Credential, bool, error) {
	return provider.Credential{
		Provider:    "simulated",
		SecretType:  "simulated",
		MaskedValue: "SIMULATED••••••••",
		ResourceRef: "simulated-resource",
	}, true, nil
}

func (a *Adapter) Validate(ctx context.Context, cred provider.Credential) (provider.ValidationResult, error) {
	return provider.ValidationResult{
		IsLive: true,
		Detail: "simulated: assumed live, no real validation call was made",
	}, nil
}

func (a *Adapter) Revoke(ctx context.Context, cred provider.Credential) (provider.RevokeResult, error) {
	return provider.RevokeResult{
		Revoked: true,
		Detail:  "simulated: no real credential was revoked",
	}, nil
}

func (a *Adapter) Rotate(ctx context.Context, cred provider.Credential) (provider.RotateResult, error) {
	return provider.RotateResult{
		NewRawValue: fmt.Sprintf("simulated-fake-value-for-%s", cred.ResourceRef),
		NewRef:      "simulated-new-resource",
		Detail:      "simulated: no real credential was created, validated, or disabled",
	}, nil
}

var _ provider.Adapter = (*Adapter)(nil)
