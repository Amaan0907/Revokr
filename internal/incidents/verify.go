package incidents

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/providers"
)

// PerformVerification disables the old credential via the adapter selected
// for inc.Simulated, then records the outcome: success moves
// VERIFYING -> RESOLVED, failure moves VERIFYING -> FAILED. Called only once
// an incident is already in VERIFYING (i.e. after PerformRotation's Rotate
// step succeeded) — it never transitions into VERIFYING itself.
func PerformVerification(ctx context.Context, pool *pgxpool.Pool, inc *Incident, actor string) error {
	cred := providers.CredentialInput{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.ResourceRef,
	}

	result, revokeErr := providers.Revoke(ctx, inc.Simulated, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if revokeErr != nil {
		metadata["error"] = revokeErr.Error()
		if txErr := Transition(ctx, pool, inc.ID, StatusFailed, actor, ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("incidents: disabling old credential failed (%v) and recording that failure also failed: %w", revokeErr, txErr)
		}
		return fmt.Errorf("incidents: disabling old credential failed for incident %s: %w", inc.ID, revokeErr)
	}

	metadata["detail"] = result.Detail
	return Transition(ctx, pool, inc.ID, StatusResolved, actor, ActionOldKeyDisabled, metadata)
}
