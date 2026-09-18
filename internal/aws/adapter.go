// Package aws implements provider.Adapter against IAM access keys, scoped to
// RemediationSandboxRole and the target user set up in Phase 0
// (see infra/notes.md). Person B fills in the actual AWS SDK calls.
package aws

import (
	"context"
	"errors"

	"github.com/Amaan0907/Revokr/internal/provider"
)

type Adapter struct {
	// TODO(person-b): AWS SDK v2 IAM client, credentials from
	// RemediationSandboxRole (assumed via STS, never the ECS task's own role).
}

func New() *Adapter {
	return &Adapter{}
}

func (a *Adapter) Detect(ctx context.Context, raw string) (provider.Credential, bool, error) {
	return provider.Credential{}, false, errors.New("aws.Adapter.Detect: not implemented")
}

func (a *Adapter) Validate(ctx context.Context, cred provider.Credential) (provider.ValidationResult, error) {
	return provider.ValidationResult{}, errors.New("aws.Adapter.Validate: not implemented")
}

func (a *Adapter) Revoke(ctx context.Context, cred provider.Credential) (provider.RevokeResult, error) {
	return provider.RevokeResult{}, errors.New("aws.Adapter.Revoke: not implemented")
}

func (a *Adapter) Rotate(ctx context.Context, cred provider.Credential) (provider.RotateResult, error) {
	return provider.RotateResult{}, errors.New("aws.Adapter.Rotate: not implemented")
}

var _ provider.Adapter = (*Adapter)(nil)
