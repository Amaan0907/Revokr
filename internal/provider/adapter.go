// Package provider defines the shared contract every credential provider
// implements. Person A wires detection output into it; each provider
// (starting with AWS, in internal/aws) implements Validate/Revoke/Rotate
// against it. Changing this interface's shape is a team conversation, not a
// solo commit — see commit.md's "four things nobody merges without checking".
package provider

import "context"

// Credential identifies the secret a provider adapter acts on.
type Credential struct {
	Provider    string // "aws" | "openai" | "github" | "gcp" | "stripe" | "slack" | "generic"
	SecretType  string
	MaskedValue string
	RawValue    string // never logged, never persisted, never sent to Bedrock
	ResourceRef string // provider-specific identifier, e.g. an IAM user ARN
}

type ValidationResult struct {
	IsLive bool
	Detail string
}

type RevokeResult struct {
	Revoked bool
	Detail  string
}

type RotateResult struct {
	NewRawValue string // handed to whatever replaces the old credential, never persisted as-is
	NewRef      string
	Detail      string
}

type Adapter interface {
	Detect(ctx context.Context, raw string) (Credential, bool, error)
	Validate(ctx context.Context, cred Credential) (ValidationResult, error)
	Revoke(ctx context.Context, cred Credential) (RevokeResult, error)
	Rotate(ctx context.Context, cred Credential) (RotateResult, error)
}
