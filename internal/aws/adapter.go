// Package aws implements provider.Adapter against real IAM access keys,
// scoped to RemediationSandboxRole and the target user set up in Phase 0
// (see infra/notes.md). Every operation here uses the manager identity's own
// credentials — the ones RemediationSandboxRole assumes — never the leaked
// key's, because the leaked key's secret half is never captured anywhere in
// this codebase (see internal/detector). The one exception is validating a
// freshly-created replacement key, which necessarily authenticates as that
// brand-new key to prove it actually works; that key is never persisted.
package aws

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/Amaan0907/Revokr/internal/provider"
	awsiam "github.com/Amaan0907/Revokr/internal/providers/aws"
)

// TargetUsernameEnv names the one IAM user this adapter is allowed to act
// on. v1 scope is a single, known, pre-provisioned sandbox user (`test-user`
// per infra/notes.md) — not a username discovered from the leaked key itself,
// which isn't possible without that key's own secret half anyway.
const TargetUsernameEnv = "REMEDIATION_TARGET_IAM_USERNAME"

type Adapter struct {
	client         *awsiam.Client
	targetUsername string
}

// New builds the adapter. The AWS client (and the credential/env checks that
// come with it) is created lazily, on first use, so constructing an Adapter
// never itself needs AWS access — only calling one of its methods does.
func New() *Adapter {
	return &Adapter{targetUsername: os.Getenv(TargetUsernameEnv)}
}

func (a *Adapter) ensureClient(ctx context.Context) (*awsiam.Client, error) {
	if a.targetUsername == "" {
		return nil, fmt.Errorf("aws.Adapter: %s is not set", TargetUsernameEnv)
	}
	if a.client != nil {
		return a.client, nil
	}
	client, err := awsiam.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("aws.Adapter: %w", err)
	}
	a.client = client
	return client, nil
}

// Detect is never called on this adapter in practice: real detection
// happens upstream in internal/detector, before a raw secret would ever
// reach an adapter at all. It exists only to satisfy provider.Adapter.
func (a *Adapter) Detect(ctx context.Context, raw string) (provider.Credential, bool, error) {
	return provider.Credential{}, false, errors.New("aws.Adapter.Detect: not used; detection happens in internal/detector")
}

// Validate reports whether the leaked access key is still active, straight
// from IAM. It can't authenticate as the leaked key itself — its secret was
// never captured — so it asks IAM, via the manager identity, whether that
// key ID is still Active on the target user.
func (a *Adapter) Validate(ctx context.Context, cred provider.Credential) (provider.ValidationResult, error) {
	client, err := a.ensureClient(ctx)
	if err != nil {
		return provider.ValidationResult{}, err
	}
	if cred.ResourceRef == "" {
		return provider.ValidationResult{}, errors.New("aws.Adapter.Validate: credential has no access key id")
	}

	active, err := client.KeyStatus(ctx, a.targetUsername, cred.ResourceRef)
	if err != nil {
		return provider.ValidationResult{}, fmt.Errorf("aws.Adapter.Validate: %w", err)
	}

	detail := "key is active in IAM"
	if !active {
		detail = "key is already inactive in IAM"
	}
	return provider.ValidationResult{IsLive: active, Detail: detail}, nil
}

// Rotate is steps 1+2 of the fixed ordering (create -> validate -> update
// destination -> verify -> disable old -> verify): create the replacement
// key, then prove it works by authenticating as it. NewRawValue is handed
// back to the caller for the GitHub Actions secret update step and is never
// persisted here.
func (a *Adapter) Rotate(ctx context.Context, cred provider.Credential) (provider.RotateResult, error) {
	client, err := a.ensureClient(ctx)
	if err != nil {
		return provider.RotateResult{}, err
	}

	newKey, err := client.CreateReplacementKey(ctx, a.targetUsername)
	if err != nil {
		return provider.RotateResult{}, fmt.Errorf("aws.Adapter.Rotate: %w", err)
	}

	if err := awsiam.ValidateKeyWithRetry(ctx, client.Region(), newKey.AccessKeyID, newKey.SecretAccessKey); err != nil {
		return provider.RotateResult{}, fmt.Errorf("aws.Adapter.Rotate: replacement key failed validation: %w", err)
	}

	return provider.RotateResult{
		NewRawValue: newKey.SecretAccessKey,
		NewRef:      newKey.AccessKeyID,
		Detail:      fmt.Sprintf("created and validated replacement key %s", newKey.AccessKeyID),
	}, nil
}

// Revoke is the later, separate disable step: deactivate the old key via the
// manager identity, then confirm IAM itself now reports it inactive. Never
// called before Rotate has already succeeded (see internal/incidents/rotate.go).
func (a *Adapter) Revoke(ctx context.Context, cred provider.Credential) (provider.RevokeResult, error) {
	client, err := a.ensureClient(ctx)
	if err != nil {
		return provider.RevokeResult{}, err
	}
	if cred.ResourceRef == "" {
		return provider.RevokeResult{}, errors.New("aws.Adapter.Revoke: credential has no access key id")
	}

	if err := client.DeactivateOldKey(ctx, a.targetUsername, cred.ResourceRef); err != nil {
		return provider.RevokeResult{}, fmt.Errorf("aws.Adapter.Revoke: %w", err)
	}

	if err := client.VerifyKeyIsDeadByStatus(ctx, a.targetUsername, cred.ResourceRef); err != nil {
		return provider.RevokeResult{}, fmt.Errorf("aws.Adapter.Revoke: %w", err)
	}

	return provider.RevokeResult{Revoked: true, Detail: "old key deactivated and confirmed inactive in IAM"}, nil
}

var _ provider.Adapter = (*Adapter)(nil)
