package incidents

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/actions"
)

// These tests drive the real remediation flow against a real Postgres, so they
// only run when TEST_DATABASE_URL points at one with every migration applied
// (a throwaway local container is fine). Without it they skip, and a normal
// `go test ./...` is unaffected. Only simulated incidents (or ones that never
// reach a provider) are used, so no AWS or GitHub credentials are needed and
// nothing outside the database is touched.

var seedCounter atomic.Int64

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping database integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect to test database: %v", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		t.Fatalf("ping test database: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// seedRepo inserts the user -> installation -> repository chain an incident
// needs, and removes everything it created (including the incidents, actions
// and audit rows hanging off it) when the test ends.
func seedRepo(t *testing.T, pool *pgxpool.Pool) string {
	t.Helper()
	ctx := context.Background()
	n := time.Now().UnixNano() + seedCounter.Add(1)

	var userID, installationID, repoID string
	if err := pool.QueryRow(ctx,
		"INSERT INTO users (github_user_id, username) VALUES ($1, $2) RETURNING id",
		n, fmt.Sprintf("flow-test-%d", n),
	).Scan(&userID); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	if err := pool.QueryRow(ctx,
		"INSERT INTO github_installations (user_id, installation_id) VALUES ($1, $2) RETURNING id",
		userID, n,
	).Scan(&installationID); err != nil {
		t.Fatalf("seed installation: %v", err)
	}
	if err := pool.QueryRow(ctx,
		"INSERT INTO repositories (installation_id, github_repo_id, owner, name, enabled) VALUES ($1, gen_random_uuid(), $2, $3, true) RETURNING id",
		installationID, "flow-test-owner", fmt.Sprintf("repo-%d", n),
	).Scan(&repoID); err != nil {
		t.Fatalf("seed repository: %v", err)
	}

	t.Cleanup(func() {
		ctx := context.Background()
		for _, stmt := range []string{
			"DELETE FROM audit_logs WHERE incident_id IN (SELECT id FROM incidents WHERE repository_id = $1)",
			"DELETE FROM actions WHERE incident_id IN (SELECT id FROM incidents WHERE repository_id = $1)",
			"DELETE FROM incidents WHERE repository_id = $1",
			"DELETE FROM repositories WHERE id = $1",
		} {
			if _, err := pool.Exec(ctx, stmt, repoID); err != nil {
				t.Logf("cleanup %q: %v", stmt, err)
			}
		}
		if _, err := pool.Exec(ctx, "DELETE FROM github_installations WHERE id = $1", installationID); err != nil {
			t.Logf("cleanup installation: %v", err)
		}
		if _, err := pool.Exec(ctx, "DELETE FROM users WHERE id = $1", userID); err != nil {
			t.Logf("cleanup user: %v", err)
		}
	})
	return repoID
}

func seedIncident(t *testing.T, pool *pgxpool.Pool, provider string, simulated bool) *Incident {
	t.Helper()
	inc := &Incident{
		RepositoryID: seedRepo(t, pool),
		CommitSHA:    "abc1234",
		FilePath:     "config/.env",
		LineNumber:   1,
		Provider:     provider,
		SecretType:   provider + "-key",
		Fingerprint:  fmt.Sprintf("fp-%d", time.Now().UnixNano()+seedCounter.Add(1)),
		MaskedValue:  "AKIA••••••••••••MPLE",
		Severity:     "HIGH",
		RiskScore:    60,
		RiskFactors:  map[string]any{},
		Status:       StatusDetected,
		Simulated:    simulated,
	}
	if provider == "aws" {
		inc.ResourceRef = "AKIAIOSFODNN7EXAMPLE"
	}
	if err := Create(context.Background(), pool, inc); err != nil {
		t.Fatalf("create incident: %v", err)
	}
	return inc
}

func statusOf(t *testing.T, pool *pgxpool.Pool, id string) Status {
	t.Helper()
	inc, err := GetByID(context.Background(), pool, id)
	if err != nil {
		t.Fatalf("get incident %s: %v", id, err)
	}
	return inc.Status
}

func wantStatus(t *testing.T, pool *pgxpool.Pool, id string, want Status) {
	t.Helper()
	if got := statusOf(t, pool, id); got != want {
		t.Fatalf("incident status = %s, want %s", got, want)
	}
}

func actionTypes(t *testing.T, pool *pgxpool.Pool, incidentID string) map[actions.Type]actions.Action {
	t.Helper()
	list, err := actions.ListByIncident(context.Background(), pool, incidentID)
	if err != nil {
		t.Fatalf("list actions: %v", err)
	}
	byType := make(map[actions.Type]actions.Action, len(list))
	for _, a := range list {
		byType[a.ActionType] = a
	}
	return byType
}

func hasAuditAction(t *testing.T, pool *pgxpool.Pool, incidentID string, want AuditAction) bool {
	t.Helper()
	logs, err := GetAuditLogs(context.Background(), pool, incidentID)
	if err != nil {
		t.Fatalf("get audit logs: %v", err)
	}
	for _, l := range logs {
		if l.Action == want {
			return true
		}
	}
	return false
}

func newRouter(pool *pgxpool.Pool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	RegisterRoutes(r, pool)
	return r
}

func doRequest(r *gin.Engine, method, path string, body any) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestSimulatedAWSFlowEndToEnd(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	inc := seedIncident(t, pool, "aws", true)

	if err := PerformValidation(ctx, pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusAwaitingApproval)

	if err := PerformRotation(ctx, pool, inc, "tester", nil); err != nil {
		t.Fatalf("PerformRotation: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusResolved)

	byType := actionTypes(t, pool, inc.ID)
	for _, typ := range []actions.Type{
		actions.TypeValidateCredential,
		actions.TypeRotateCredential,
		actions.TypeUpdateGithubSecret,
		actions.TypeDisableOldCredential,
	} {
		a, ok := byType[typ]
		if !ok {
			t.Errorf("missing %s action row", typ)
			continue
		}
		if a.Status != actions.StatusSucceeded {
			t.Errorf("%s status = %s, want SUCCEEDED", typ, a.Status)
		}
		if a.StartedAt == nil || a.CompletedAt == nil {
			t.Errorf("%s should have started_at and completed_at set", typ)
		}
	}
	if len(byType) != 4 {
		t.Errorf("got %d action rows, want 4", len(byType))
	}

	got, err := GetByID(ctx, pool, inc.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.ResolvedAt == nil {
		t.Error("resolved incident should have resolved_at set")
	}
	if got.ResourceRef != "AKIAIOSFODNN7EXAMPLE" {
		t.Errorf("resource_ref = %q, want it stored and read back unchanged", got.ResourceRef)
	}
	for _, want := range []AuditAction{ActionApproved, ActionKeyCreated, ActionGHSecretUpdated, ActionOldKeyDisabled} {
		if !hasAuditAction(t, pool, inc.ID, want) {
			t.Errorf("audit log is missing %q", want)
		}
	}
}

func TestRealNonAWSIncidentIsNotSupported(t *testing.T) {
	pool := testPool(t)
	inc := seedIncident(t, pool, "github", false)

	if err := PerformValidation(context.Background(), pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusNotSupported)

	if n := len(actionTypes(t, pool, inc.ID)); n != 0 {
		t.Errorf("an unsupported incident should record no remediation actions, got %d", n)
	}
	if !hasAuditAction(t, pool, inc.ID, ActionNotSupported) {
		t.Error("audit log should record not_supported")
	}
}

func TestSimulatedNonAWSFlowSkipsGitHubSecretStep(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	inc := seedIncident(t, pool, "github", true)

	if err := PerformValidation(ctx, pool, inc, "tester"); err != nil {
		t.Fatalf("PerformValidation: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusAwaitingApproval)
	if err := PerformRotation(ctx, pool, inc, "tester", nil); err != nil {
		t.Fatalf("PerformRotation: %v", err)
	}
	wantStatus(t, pool, inc.ID, StatusResolved)

	byType := actionTypes(t, pool, inc.ID)
	if _, ok := byType[actions.TypeUpdateGithubSecret]; ok {
		t.Error("only AWS has a GitHub secret destination; other providers should not record that step")
	}
	if len(byType) != 3 {
		t.Errorf("got %d action rows, want 3 (validate, rotate, disable)", len(byType))
	}
}

func TestApproveRefusesAnIncidentNotAwaitingApproval(t *testing.T) {
	pool := testPool(t)
	inc := seedIncident(t, pool, "aws", true) // still DETECTED: never validated
	r := newRouter(pool)

	rec := doRequest(r, http.MethodPost, "/api/incidents/"+inc.ID+"/approve", nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("approve on a DETECTED incident = %d, want 400 (body: %s)", rec.Code, rec.Body.String())
	}
	wantStatus(t, pool, inc.ID, StatusDetected)
	if n := len(actionTypes(t, pool, inc.ID)); n != 0 {
		t.Errorf("a refused approval must not start any remediation step, got %d actions", n)
	}
}

func TestApproveAndDenyEndpoints(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	r := newRouter(pool)

	approved := seedIncident(t, pool, "aws", true)
	denied := seedIncident(t, pool, "aws", true)
	for _, inc := range []*Incident{approved, denied} {
		if err := PerformValidation(ctx, pool, inc, "tester"); err != nil {
			t.Fatalf("PerformValidation: %v", err)
		}
	}

	rec := doRequest(r, http.MethodPost, "/api/incidents/"+approved.ID+"/approve", map[string]any{"actor": "sameer"})
	if rec.Code != http.StatusOK {
		t.Fatalf("approve = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	wantStatus(t, pool, approved.ID, StatusResolved)

	rec = doRequest(r, http.MethodGet, "/api/incidents/"+approved.ID+"/actions", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET actions = %d, want 200", rec.Code)
	}
	var listed struct {
		Actions []actions.Action `json:"actions"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &listed); err != nil {
		t.Fatalf("decode actions response: %v", err)
	}
	if len(listed.Actions) != 4 {
		t.Errorf("GET actions returned %d rows, want 4", len(listed.Actions))
	}

	rec = doRequest(r, http.MethodPost, "/api/incidents/"+denied.ID+"/deny", map[string]any{"reason": "not ours"})
	if rec.Code != http.StatusOK {
		t.Fatalf("deny = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	wantStatus(t, pool, denied.ID, StatusRequiresUserAction)
	if !hasAuditAction(t, pool, denied.ID, ActionDenied) {
		t.Error("audit log should record denied")
	}
	byType := actionTypes(t, pool, denied.ID)
	if _, ok := byType[actions.TypeRotateCredential]; ok {
		t.Error("a denied incident must never start rotation")
	}
	if len(byType) != 1 {
		t.Errorf("denied incident should only have its validate action, got %d rows", len(byType))
	}
}

func TestActionStartIsIdempotentAndFailRecordsError(t *testing.T) {
	pool := testPool(t)
	ctx := context.Background()
	inc := seedIncident(t, pool, "aws", true)

	first, err := actions.Start(ctx, pool, inc.ID, actions.TypeRotateCredential, 1)
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	again, err := actions.Start(ctx, pool, inc.ID, actions.TypeRotateCredential, 1)
	if err != nil {
		t.Fatalf("Start (repeat): %v", err)
	}
	if first.ID != again.ID {
		t.Errorf("repeat Start created a new row (%s vs %s); the idempotency key should reuse it", first.ID, again.ID)
	}

	if err := actions.Fail(ctx, pool, first.ID, "boom"); err != nil {
		t.Fatalf("Fail: %v", err)
	}
	rows, err := actions.ListByIncident(ctx, pool, inc.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 {
		t.Fatalf("got %d rows, want 1", len(rows))
	}
	if rows[0].Status != actions.StatusFailed || rows[0].Error == nil || *rows[0].Error != "boom" {
		t.Errorf("failed row = %+v, want FAILED with error %q", rows[0], "boom")
	}
}
