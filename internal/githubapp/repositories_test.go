package githubapp

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func listRepositories(t *testing.T, query string) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	RegisterRepositoryRoutes(r, nil)

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/repositories"+query, nil))
	return rec
}

func TestListRepositoriesRequiresInstallerID(t *testing.T) {
	for _, query := range []string{"", "?installer_github_id=", "?installer_github_id=abc", "?installer_github_id=0", "?installer_github_id=-5"} {
		if rec := listRepositories(t, query); rec.Code != http.StatusBadRequest {
			t.Errorf("query %q: expected 400, got %d", query, rec.Code)
		}
	}
}

func TestListRepositoriesWithoutDatabaseIsEmpty(t *testing.T) {
	rec := listRepositories(t, "?installer_github_id=42")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"repositories":[]`) {
		t.Errorf("expected an empty list, got %s", rec.Body.String())
	}
}
