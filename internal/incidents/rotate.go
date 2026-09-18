package incidents

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/providers"
)

// PerformRotation drives an incident from AWAITING_APPROVAL all the way to
// RESOLVED (or FAILED at whichever step fails), calling the adapter selected
// for inc.Simulated (real vs. simulated — see providers.Select) along the
// way. A single approval runs the whole remaining sequence from CLAUDE.md's
// ordering rule — nothing here waits for a second human action:
//
//  1. AWAITING_APPROVAL -> ROTATING (records that rotation is starting)
//  2. call providers.Rotate
//  3. ROTATING -> VERIFYING on success, or ROTATING -> FAILED on error
//  4. hands off to PerformVerification for the disable-old-credential step
//
// approvalMetadata is whatever the approval request carried (e.g. who
// approved it) and is attached to the first transition only.
func PerformRotation(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor string, approvalMetadata any) error {
	if err := Transition(ctx, pool, inc.ID, StatusRotating, actor, ActionApproved, approvalMetadata); err != nil {
		return fmt.Errorf("incidents: cannot begin rotation for incident %s: %w", inc.ID, err)
	}

	cred := providers.CredentialInput{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.Fingerprint,
	}

	result, rotateErr := providers.Rotate(ctx, inc.Simulated, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if rotateErr != nil {
		metadata["error"] = rotateErr.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: rotation failed (%v) and recording that failure also failed: %w", rotateErr, txErr)
		}
		return fmt.Errorf("incidents: rotation failed for incident %s: %w", inc.ID, rotateErr)
	}

	metadata["detail"] = result.Detail
	if err := Transition(ctx, pool, inc.ID, StatusVerifying, actor, ActionKeyCreated, metadata); err != nil {
		return fmt.Errorf("incidents: rotated but failed to record VERIFYING for incident %s: %w", inc.ID, err)
	}

	return PerformVerification(ctx, pool, inc, actor)
}
