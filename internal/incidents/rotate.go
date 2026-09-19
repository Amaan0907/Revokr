package incidents

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/actions"
	"github.com/Amaan0907/Revokr/internal/providers"
	githubactions "github.com/Amaan0907/Revokr/internal/providers/github"
)

// PerformRotation drives an incident from AWAITING_APPROVAL all the way to
// RESOLVED (or FAILED at whichever step fails), calling the adapter selected
// for inc.Simulated (real vs. simulated — see providers.Select) along the
// way. A single approval runs the whole remaining sequence from CLAUDE.md's
// ordering rule — nothing here waits for a second human action:
//
//  1. AWAITING_APPROVAL -> ROTATING (records that rotation is starting)
//  2. call providers.Rotate, recorded as a ROTATE_CREDENTIAL actions row
//  3. update the GitHub Actions secret with the replacement, recorded as an
//     UPDATE_GITHUB_SECRET actions row (see updateGitHubSecret's v1 scope note)
//  4. ROTATING -> VERIFYING on success, or ROTATING -> FAILED on error
//  5. hands off to PerformVerification for the disable-old-credential step
//
// approvalMetadata is whatever the approval request carried (e.g. who
// approved it) and is attached to the first transition only.
func PerformRotation(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor string, approvalMetadata any) error {
	if err := Transition(ctx, pool, inc.ID, StatusRotating, actor, ActionApproved, approvalMetadata); err != nil {
		return fmt.Errorf("incidents: cannot begin rotation for incident %s: %w", inc.ID, err)
	}

	rotateAction, actErr := actions.Start(ctx, pool, inc.ID, actions.TypeRotateCredential, 1)
	if actErr != nil {
		return fmt.Errorf("incidents: cannot record rotate step for incident %s: %w", inc.ID, actErr)
	}

	cred := providers.CredentialInput{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.ResourceRef,
	}

	result, rotateErr := providers.Rotate(ctx, inc.Simulated, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if rotateErr != nil {
		_ = actions.Fail(ctx, pool, rotateAction.ID, rotateErr.Error())
		metadata["error"] = rotateErr.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: rotation failed (%v) and recording that failure also failed: %w", rotateErr, txErr)
		}
		return fmt.Errorf("incidents: rotation failed for incident %s: %w", inc.ID, rotateErr)
	}

	if err := actions.Succeed(ctx, pool, rotateAction.ID); err != nil {
		return fmt.Errorf("incidents: rotated but failed to record action success for incident %s: %w", inc.ID, err)
	}

	if err := updateGitHubSecret(ctx, pool, inc, actor, result.NewRef, result.NewRawValue); err != nil {
		metadata["error"] = err.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: github secret update failed (%v) and recording that failure also failed: %w", err, txErr)
		}
		return fmt.Errorf("incidents: github secret update failed for incident %s: %w", inc.ID, err)
	}

	metadata["detail"] = result.Detail
	if err := Transition(ctx, pool, inc.ID, StatusVerifying, actor, ActionKeyCreated, metadata); err != nil {
		return fmt.Errorf("incidents: rotated but failed to record VERIFYING for incident %s: %w", inc.ID, err)
	}

	return PerformVerification(ctx, pool, inc, actor)
}

// updateGitHubSecret writes the replacement credential into the repository's
// GitHub Actions secrets — the "update destination" step of the fixed
// ordering (create -> validate -> update destination -> verify -> disable
// old -> verify), recorded as its own UPDATE_GITHUB_SECRET actions row. It
// runs after the replacement is created and validated, but before the old
// credential is ever disabled.
//
// v1 scope: only AWS has a real destination to update (see
// providers.Select's own v1 scope note) — other providers skip this step
// entirely for now, with no actions row or audit entry, since no real
// remediation reaches them either. A simulated incident never makes a real
// GitHub API call, but still gets an actions row and audit entry labeled
// simulated, so its timeline reads the same shape as a real one.
//
// Known follow-up: this authenticates with a single GITHUB_TOKEN (a personal
// access token) rather than a per-installation GitHub App token, because the
// installation-token exchange and the github_installations persistence it
// needs don't exist yet (see the TODO in internal/githubapp/install.go).
// Swap this for a real installation token once that lands.
func updateGitHubSecret(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor, newAccessKeyID, newSecretAccessKey string) error {
	if inc.Provider != "aws" {
		return nil
	}

	act, actErr := actions.Start(ctx, pool, inc.ID, actions.TypeUpdateGithubSecret, 1)
	if actErr != nil {
		return fmt.Errorf("cannot record github secret update step for incident %s: %w", inc.ID, actErr)
	}
	fail := func(err error) error {
		_ = actions.Fail(ctx, pool, act.ID, err.Error())
		return err
	}

	if inc.Simulated {
		if err := actions.Succeed(ctx, pool, act.ID); err != nil {
			return err
		}
		return RecordAuditLog(ctx, pool, &AuditLog{
			IncidentID: inc.ID,
			Actor:      actor,
			Action:     ActionGHSecretUpdated,
			Result:     ResultSuccess,
			Metadata: map[string]any{
				"simulated": true,
				"secrets":   []string{githubactions.AWSAccessKeyIDSecretName, githubactions.AWSSecretAccessKeySecretName},
			},
		})
	}

	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		return fail(fmt.Errorf("GITHUB_TOKEN is not set"))
	}

	owner, repo, err := RepositoryOwnerName(ctx, pool, inc.RepositoryID)
	if err != nil {
		return fail(err)
	}

	client := githubactions.NewClient(owner, repo, token)

	if err := client.PutSecret(ctx, githubactions.AWSAccessKeyIDSecretName, newAccessKeyID); err != nil {
		return fail(fmt.Errorf("update %s: %w", githubactions.AWSAccessKeyIDSecretName, err))
	}
	if err := client.PutSecret(ctx, githubactions.AWSSecretAccessKeySecretName, newSecretAccessKey); err != nil {
		return fail(fmt.Errorf("update %s: %w", githubactions.AWSSecretAccessKeySecretName, err))
	}

	if err := actions.Succeed(ctx, pool, act.ID); err != nil {
		return err
	}

	return RecordAuditLog(ctx, pool, &AuditLog{
		IncidentID: inc.ID,
		Actor:      actor,
		Action:     ActionGHSecretUpdated,
		Result:     ResultSuccess,
		Metadata: map[string]any{
			"repository": fmt.Sprintf("%s/%s", owner, repo),
			"secrets":    []string{githubactions.AWSAccessKeyIDSecretName, githubactions.AWSSecretAccessKeySecretName},
		},
	})
}
