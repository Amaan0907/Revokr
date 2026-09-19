// Package notifications posts short incident summaries to a team chat channel
// (Slack). Phase 9 of the plan asks for one channel, and for messages that say
// the repository, provider, commit, risk score and status — nothing else. The
// secret itself is never in scope here: Message has no field that could hold
// one, not even the masked value, so there is nothing to leak by mistake.
package notifications

import "context"

// Message is everything a notification is allowed to say.
type Message struct {
	Repository string // "owner/name"
	Provider   string
	CommitSHA  string
	RiskScore  int
	Severity   string // shown next to the score so it reads at a glance
	Status     string // an incidents.Status value, e.g. "AWAITING_APPROVAL"
	Simulated  bool   // labelled in the message, so a rehearsal can't be mistaken for a real leak
}

// Notifier delivers a Message. Implementations must not retry silently or
// block for long: a slow or broken channel must never hold up remediation.
type Notifier interface {
	Send(ctx context.Context, m Message) error
}

var severityRank = map[string]int{
	"LOW":      1,
	"MEDIUM":   2,
	"HIGH":     3,
	"CRITICAL": 4,
}

// ValidSeverity reports whether s is one of the four incident severities.
func ValidSeverity(s string) bool {
	_, ok := severityRank[s]
	return ok
}

// MeetsSeverity reports whether an incident of the given severity is at or
// above the minimum worth posting about. An unknown severity never qualifies.
func MeetsSeverity(severity, minimum string) bool {
	got, ok := severityRank[severity]
	if !ok {
		return false
	}
	return got >= severityRank[minimum]
}
