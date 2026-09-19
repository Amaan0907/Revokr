package incidents

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/actions"
	"github.com/Amaan0907/Revokr/internal/notifications"
)

var notifyState struct {
	mu          sync.RWMutex
	notifier    notifications.Notifier
	minSeverity string
}

// SetNotifier turns notifications on for every status change made through
// Transition, in this process. Call it once at startup; passing nil turns them
// off again. An empty minSeverity means notifications.DefaultMinSeverity.
func SetNotifier(n notifications.Notifier, minSeverity string) {
	if minSeverity == "" {
		minSeverity = notifications.DefaultMinSeverity
	}
	notifyState.mu.Lock()
	defer notifyState.mu.Unlock()
	notifyState.notifier = n
	notifyState.minSeverity = minSeverity
}

func currentNotifier() (notifications.Notifier, string) {
	notifyState.mu.RLock()
	defer notifyState.mu.RUnlock()
	return notifyState.notifier, notifyState.minSeverity
}

// The statuses worth a message: a person is needed (AWAITING_APPROVAL,
// REQUIRES_USER_ACTION, NOT_SUPPORTED, FAILED) or the incident is done
// (RESOLVED). The steps in between would only be noise.
var notifiableStatuses = map[Status]bool{
	StatusAwaitingApproval:   true,
	StatusResolved:           true,
	StatusFailed:             true,
	StatusRequiresUserAction: true,
	StatusNotSupported:       true,
}

// notifyTransition runs after a successful status change. It's detached from
// the caller — a slow or broken channel can neither delay nor fail a
// remediation step — and it only ever logs its own problems.
func notifyTransition(ctx context.Context, pool *pgxpool.Pool, incidentID string, target Status) {
	n, minSeverity := currentNotifier()
	if n == nil || !notifiableStatuses[target] {
		return
	}

	detached := context.WithoutCancel(ctx)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("incidents: notification for %s panicked: %v", incidentID, r)
			}
		}()
		ctx, cancel := context.WithTimeout(detached, 20*time.Second)
		defer cancel()
		sendTransitionNotification(ctx, pool, incidentID, target, n, minSeverity)
	}()
}

func sendTransitionNotification(ctx context.Context, pool *pgxpool.Pool, incidentID string, target Status, n notifications.Notifier, minSeverity string) {
	var (
		owner, name, provider, commitSHA, severity string
		riskScore                                  int
		simulated                                  bool
	)
	err := pool.QueryRow(ctx, `
		SELECT r.owner, r.name, i.provider, i.commit_sha, i.severity, i.risk_score, i.simulated
		FROM incidents i
		JOIN repositories r ON r.id = i.repository_id
		WHERE i.id = $1`, incidentID,
	).Scan(&owner, &name, &provider, &commitSHA, &severity, &riskScore, &simulated)
	if err != nil {
		log.Printf("incidents: cannot build notification for %s: %v", incidentID, err)
		return
	}
	if !notifications.MeetsSeverity(severity, minSeverity) {
		return
	}

	msg := notifications.Message{
		Repository: owner + "/" + name,
		Provider:   provider,
		CommitSHA:  commitSHA,
		RiskScore:  riskScore,
		Severity:   severity,
		Status:     string(target),
		Simulated:  simulated,
	}

	if target != StatusResolved {
		if err := n.Send(ctx, msg); err != nil {
			log.Printf("incidents: notification for %s failed: %v", incidentID, err)
		}
		return
	}

	// The resolved summary is the plan's final SEND_NOTIFICATION step, so it
	// gets an actions row like the other steps and the dashboard checklist can
	// show it. If that row can't be written the message still goes out.
	act, actErr := actions.Start(ctx, pool, incidentID, actions.TypeSendNotification, 1)
	if actErr != nil {
		log.Printf("incidents: cannot record notification step for %s: %v", incidentID, actErr)
	}

	sendErr := n.Send(ctx, msg)
	if sendErr != nil {
		log.Printf("incidents: notification for %s failed: %v", incidentID, sendErr)
	}
	if act == nil {
		return
	}
	if sendErr != nil {
		_ = actions.Fail(ctx, pool, act.ID, sendErr.Error())
		return
	}
	_ = actions.Succeed(ctx, pool, act.ID)
}
