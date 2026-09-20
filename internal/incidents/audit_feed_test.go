package incidents

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// With no database the feed must still answer with an empty list, the same as
// the incident list does, so the dashboard shows "no activity" instead of an error.
func TestAuditFeedWithoutDatabase(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	RegisterRoutes(r, nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/audit?limit=5", nil))

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if got := strings.TrimSpace(w.Body.String()); got != `{"audit_logs":[]}` {
		t.Errorf("unexpected body: %s", got)
	}
}
