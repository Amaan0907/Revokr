package incidents

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/actions"
	"github.com/Amaan0907/Revokr/internal/providers"
)

// PerformValidation drives an incident from DETECTED to AWAITING_APPROVAL (or
// FAILED, or NOT_SUPPORTED), calling the adapter selected for inc.Simulated
// to check whether the credential is actually live. Whether or not it's
// live, the incident still lands at AWAITING_APPROVAL — the approval gate
// applies regardless of validation result (see CLAUDE.md's "Approval gate"
// rule); IsLive is only carried in the audit metadata so a human approver
// can see it:
//
//  1. DETECTED -> VALIDATING (records that validation is starting)
//  2. a real (non-simulated) incident for a provider with no real adapter
//     yet goes straight to NOT_SUPPORTED here — see the v1 scope note below
//  3. call providers.Validate, recorded as a VALIDATE_CREDENTIAL actions row
//  4. VALIDATING -> AWAITING_APPROVAL on success, or VALIDATING -> FAILED on error
func PerformValidation(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor string) error {
	if err := Transition(ctx, pool, inc.ID, StatusValidating, actor, ActionValidated, nil); err != nil {
		return fmt.Errorf("incidents: cannot begin validation for incident %s: %w", inc.ID, err)
	}

	// v1 scope: only AWS has a real adapter (see providers.Select's own v1
	// scope note). Before this check existed, a real incident for any other
	// provider was still run through the AWS adapter with data that doesn't
	// belong to it (an empty or wrong ResourceRef), which failed with a
	// confusing error and landed at FAILED — implying an attempt was made and
	// didn't work, when really no attempt should have been made at all.
	// Simulated incidents skip this check on purpose: Simulation Mode plays
	// the full flow for any provider, real adapter or not.
	if !inc.Simulated && inc.Provider != "aws" {
		return Transition(ctx, pool, inc.ID, StatusNotSupported, actor, ActionNotSupported, map[string]any{
			"reason": fmt.Sprintf("no real remediation adapter for provider %q yet", inc.Provider),
		})
	}

	act, actErr := actions.Start(ctx, pool, inc.ID, actions.TypeValidateCredential, 1)
	if actErr != nil {
		return fmt.Errorf("incidents: cannot record validate step for incident %s: %w", inc.ID, actErr)
	}

	cred := providers.CredentialInput{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.ResourceRef,
	}

	result, validateErr := providers.Validate(ctx, inc.Simulated, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if validateErr != nil {
		_ = actions.Fail(ctx, pool, act.ID, validateErr.Error())
		metadata["error"] = validateErr.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: validation failed (%v) and recording that failure also failed: %w", validateErr, txErr)
		}
		return fmt.Errorf("incidents: validation failed for incident %s: %w", inc.ID, validateErr)
	}

	if err := actions.Succeed(ctx, pool, act.ID); err != nil {
		return fmt.Errorf("incidents: validated but failed to record action success for incident %s: %w", inc.ID, err)
	}

	metadata["is_live"] = result.IsLive
	metadata["detail"] = result.Detail
	return Transition(ctx, pool, inc.ID, StatusAwaitingApproval, actor, ActionAuthRequested, metadata)
}
