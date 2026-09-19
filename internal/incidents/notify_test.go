package incidents

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/actions"
	"github.com/Amaan0907/Revokr/internal/notifications"
)

// fakeNotifier records what it's asked to send. Notifications are sent from a
// goroutine, so the tests wait on a channel rather than assuming an order.
type fakeNotifier struct {
	mu   sync.Mutex
	err  error
	sent chan notifications.Message
}

func newFakeNotifier(err error) *fakeNotifier {
	return &fakeNotifier{err: err, sent: make(chan notifications.Message, 16)}
}

func (f *fakeNotifier) Send(_ context.Context, m notifications.Message) error {
	f.sent <- m
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.err
}

func useNotifier(t *testing.T, n notifications.Notifier, minSeverity string) {
	t.Helper()
	SetNotifier(n, minSeverity)
	t.Cleanup(func() { SetNotifier(nil, "") })
}

func nextMessage(t *testing.T, f *fakeNotifier) notifications.Message {
	t.Helper()
	select {
	case m := <-f.sent:
		return m
	case <-time.After(3 * time.Second):
		t.Fatal("timed out waiting for a notification")
		return notifications.Message{}
	}
}

func expectNoMessage(t *testing.T, f *fakeNotifier) {
	t.Helper()
	select {
	case m := <-f.sent:
		t.Fatalf("unexpected notification: %+v", m)
	case <-time.After(400 * time.Millisecond):
	}
}

// waitForAction polls until the incident has an action of the given type in
// the given status: the SEND_NOTIFICATION row is written after the message is
// sent, on the notification goroutine.
func waitForAction(t *testing.T, pool *pgxpool.Pool, incidentID string, typ actions.Type, want actions.Status) actions.Action {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for {
		if a, ok := actionTypes(t, pool, incidentID)[typ]; ok && a.Status == want {
			return a
		}
		if time.Now().After(deadline) {
			t.Fatalf("timed out waiting for %s to reach %s", typ, want)
		}
		time.Sleep(50 * time.Millisecond)
	}
}

func TestNotificationsFireForTheStatusesThatNeedAPerson(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	fake := newFakeNotifier(nil)
	useNotifier(t, fake, "HIGH")
	inc := seedIncident(t, pool, "aws", true)

	if err := PerformValidation(ctx, pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	m := nextMessage(t, fake)
	if m.Status != string(StatusAwaitingApproval) {
		t.Errorf("first message status = %s, want AWAITING_APPROVAL", m.Status)
	}
	if !strings.HasPrefix(m.Repository, "flow-test-owner/") || m.Provider != "aws" ||
		m.CommitSHA != "abc1234" || m.RiskScore != 60 || m.Severity != "HIGH" || !m.Simulated {
		t.Errorf("message has the wrong contents: %+v", m)
	}
	// The masked value and the access key id must never reach a notification.
	if dump := fmt.Sprintf("%+v", m); strings.Contains(dump, "AKIA") {
		t.Errorf("notification contains key material: %s", dump)
	}

	if err := PerformRotation(ctx, pool, inc, "tester", nil); err != nil {
		t.Fatalf("PerformRotation: %v", err)
	}
	if m := nextMessage(t, fake); m.Status != string(StatusResolved) {
		t.Errorf("second message status = %s, want RESOLVED", m.Status)
	}
	// The in-between steps (ROTATING, VERIFYING) are noise and stay silent.
	expectNoMessage(t, fake)

	a := waitForAction(t, pool, inc.ID, actions.TypeSendNotification, actions.StatusSucceeded)
	if a.StartedAt == nil || a.CompletedAt == nil {
		t.Error("the notification step should record when it started and finished")
	}
}

func TestNotificationsRespectTheMinimumSeverity(t *testing.T) {
	pool := testPool(t)
	fake := newFakeNotifier(nil)
	useNotifier(t, fake, "CRITICAL")
	inc := seedIncident(t, pool, "aws", true) // HIGH, below the bar

	if err := PerformValidation(context.Background(), pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	expectNoMessage(t, fake)
}

func TestUnsupportedProviderNotifiesSoSomeoneRotatesItByHand(t *testing.T) {
	pool := testPool(t)
	fake := newFakeNotifier(nil)
	useNotifier(t, fake, "HIGH")
	inc := seedIncident(t, pool, "github", false)

	if err := PerformValidation(context.Background(), pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	if m := nextMessage(t, fake); m.Status != string(StatusNotSupported) {
		t.Errorf("status = %s, want NOT_SUPPORTED", m.Status)
	}
}

func TestABrokenChannelNeverBlocksOrFailsRemediation(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	fake := newFakeNotifier(errors.New("boom"))
	useNotifier(t, fake, "HIGH")
	inc := seedIncident(t, pool, "aws", true)

	if err := PerformValidation(ctx, pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation must not fail because Slack did: %v", err)
	}
	if err := PerformRotation(ctx, pool, inc, "tester", nil); err != nil {
		t.Fatalf("PerformRotation must not fail because Slack did: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusResolved)

	a := waitForAction(t, pool, inc.ID, actions.TypeSendNotification, actions.StatusFailed)
	if a.Error == nil || !strings.Contains(*a.Error, "boom") {
		t.Errorf("the failed notification step should record why, got %v", a.Error)
	}
}
