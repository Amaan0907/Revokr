package githubapp

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type fakeAccountStore struct {
	got    int64
	result AccountDeletion
	err    error
}

func (f *fakeAccountStore) DeleteAccount(_ context.Context, id int64) (AccountDeletion, error) {
	f.got = id
	return f.result, f.err
}

func deleteAccount(t *testing.T, store AccountStore, query string) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	RegisterAccountRoutes(r, store)

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/api/account"+query, nil))
	return rec
}

func TestDeleteAccountRequiresAValidID(t *testing.T) {
	store := &fakeAccountStore{}
	for _, query := range []string{"", "?github_user_id=", "?github_user_id=abc", "?github_user_id=0", "?github_user_id=-1"} {
		if rec := deleteAccount(t, store, query); rec.Code != http.StatusBadRequest {
			t.Errorf("query %q: expected 400, got %d", query, rec.Code)
		}
	}
	if store.got != 0 {
		t.Errorf("the store must not be called for an invalid id, got %d", store.got)
	}
}

func TestDeleteAccountWithoutDatabaseIsUnavailable(t *testing.T) {
	if rec := deleteAccount(t, nil, "?github_user_id=42"); rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}
}

func TestDeleteAccountReportsWhatWasRemoved(t *testing.T) {
	store := &fakeAccountStore{result: AccountDeletion{Found: true, Installations: 1, Repositories: 2, Incidents: 3}}
	rec := deleteAccount(t, store, "?github_user_id=42")

	if rec.Code != http.StatusOK || store.got != 42 {
		t.Fatalf("expected 200 for id 42, got %d for id %d", rec.Code, store.got)
	}
	for _, want := range []string{`"found":true`, `"repositories":2`, `"incidents":3`} {
		if !strings.Contains(rec.Body.String(), want) {
			t.Errorf("response %s is missing %s", rec.Body.String(), want)
		}
	}
}

func TestDeleteAccountHidesStoreErrors(t *testing.T) {
	store := &fakeAccountStore{err: errors.New(`delete incidents: pq: secret table detail`)}
	rec := deleteAccount(t, store, "?github_user_id=42")

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "secret table detail") {
		t.Errorf("the response must not include the store's error: %s", rec.Body.String())
	}
}
