// Package providers also drives the one point in the incident lifecycle
// where a real (or simulated) provider call actually happens. Everything
// else in internal/incidents.Transition only ever changes a status row and
// writes an audit log — it never touches a credential.
package providers

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/incidents"
	"github.com/Amaan0907/Revokr/internal/provider"
)

// credentialFromIncident maps the columns already on an Incident onto the
// Credential shape provider.Adapter expects. Deliberately pure/no I/O so it
// can be unit tested without a database.
func credentialFromIncident(inc *incidents.Incident) provider.Credential {
	return provider.Credential{
		Provider:    inc.Provider,
		SecretType:  inc.SecretType,
		MaskedValue: inc.MaskedValue,
		ResourceRef: inc.Fingerprint,
	}
}

// PerformRotation calls the adapter selected for inc (simulated vs. real,
// per inc.Simulated — see Select) to rotate its credential, then records the
// outcome through the existing incidents.Transition: success moves
// ROTATING -> VERIFYING, failure moves ROTATING -> FAILED. This is the one
// place a transition to ROTATING actually reaches a provider.Adapter.
func PerformRotation(ctx context.Context, pool *pgxpool.Pool, inc *incidents.Incident, actor string) error {
	adapter := Select(inc.Simulated)
	cred := credentialFromIncident(inc)

	result, rotateErr := adapter.Rotate(ctx, cred)

	metadata := map[string]any{"simulated": inc.Simulated}

	if rotateErr != nil {
		metadata["error"] = rotateErr.Error()
		if txErr := incidents.Transition(ctx, pool, inc.ID, incidents.StatusFailed, actor, incidents.ActionFailed, metadata); txErr != nil {
			return fmt.Errorf("providers: rotation failed (%v) and recording that failure also failed: %w", rotateErr, txErr)
		}
		return fmt.Errorf("providers: rotation failed for incident %s: %w", inc.ID, rotateErr)
	}

	metadata["detail"] = result.Detail
	return incidents.Transition(ctx, pool, inc.ID, incidents.StatusVerifying, actor, incidents.ActionKeyCreated, metadata)
}
