// Package providers selects which provider.Adapter implementation handles a
// given incident. This is the one place that decision gets made — callers
// never construct an Adapter themselves, so a simulated incident can never
// accidentally reach a real provider call.
package providers

import (
	"github.com/Amaan0907/Revokr/internal/aws"
	"github.com/Amaan0907/Revokr/internal/provider"
	"github.com/Amaan0907/Revokr/internal/providers/simulated"
)

// Select returns the Adapter that must handle this incident. isSimulated=true
// always routes to the simulated adapter, regardless of anything else — there
// is no path from a simulated incident to a real provider call.
//
// v1 scope discipline (see CLAUDE.md §1): AWS is the only provider with real
// remediation, so the non-simulated path always returns the AWS adapter for
// now — this is the single place that changes if/when another provider gets
// real remediation.
func Select(isSimulated bool) provider.Adapter {
	if isSimulated {
		return simulated.New()
	}
	return aws.New()
}
