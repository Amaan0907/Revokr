package incidents

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/providers"
)

// PerformValidation drives an incident from DETECTED to AWAITING_APPROVAL (or
// FAILED), calling the adapter selected for inc.Simulated to check whether
// the credential is actually live. Whether or not it's live, the incident
// still lands at AWAITING_APPROVAL — the approval gate applies regardless of
// validation result (see CLAUDE.md's "Approval gate" rule); IsLive is only
// carried in the audit metadata so a human approver can see it:
//
//  1. DETECTED -> VALIDATING (records that validation is starting)
//  2. call providers.Validate
//  3. VALIDATING -> AWAITING_APPROVAL on success, or VALIDATING -> FAILED on error
func PerformValidation(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor string) error {
	if err := Transition(ctx, pool, inc.ID, StatusValidating, actor, ActionValidated, nil); err != nil {
		return fmt.Errorf("incidents: cannot begin validation for incident %s: %w", inc.ID, err)
	}

	cred := providers.CredentialInput{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.Fingerprint,
	}

	result, validateErr := providers.Validate(ctx, inc.Simulated, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if validateErr != nil {
		metadata["error"] = validateErr.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: validation failed (%v) and recording that failure also failed: %w", validateErr, txErr)
		}
		return fmt.Errorf("incidents: validation failed for incident %s: %w", inc.ID, validateErr)
	}

	metadata["is_live"] = result.IsLive
	metadata["detail"] = result.Detail
	return Transition(ctx, pool, inc.ID, StatusAwaitingApproval, actor, ActionAuthRequested, metadata)
}
