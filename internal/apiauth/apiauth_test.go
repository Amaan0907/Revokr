package apiauth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

const testKey = "0123456789abcdef0123456789abcdef"

// newRouter mirrors the real layout: the middleware is registered first, then
// one protected route and the routes that must stay reachable without the key.
// apiHits counts how often the protected handler actually ran.
func newRouter(key string) (r *gin.Engine, apiHits *int) {
	gin.SetMode(gin.TestMode)
	r = gin.New()
	r.Use(Require(key))

	apiHits = new(int)
	r.GET("/api/incidents", func(c *gin.Context) {
		*apiHits++
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.POST("/api/incidents/:id/approve", func(c *gin.Context) {
		*apiHits++
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.POST("/webhooks/github", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.GET("/github/install/callback", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	return r, apiHits
}

func do(r *gin.Engine, method, path, key string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, nil)
	if key != "" {
		req.Header.Set(Header, key)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestUnsetKeyLeavesAPIOpen(t *testing.T) {
	r, hits := newRouter("")

	if rec := do(r, http.MethodGet, "/api/incidents", ""); rec.Code != http.StatusOK {
		t.Fatalf("GET /api/incidents with no key configured = %d, want 200", rec.Code)
	}
	if *hits != 1 {
		t.Errorf("handler ran %d times, want 1", *hits)
	}
}

func TestMissingKeyIsRejected(t *testing.T) {
	r, hits := newRouter(testKey)

	rec := do(r, http.MethodGet, "/api/incidents", "")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("no header = %d, want 401", rec.Code)
	}
	if *hits != 0 {
		t.Error("handler ran even though the request was rejected")
	}
}

func TestWrongKeyIsRejected(t *testing.T) {
	r, hits := newRouter(testKey)

	for _, wrong := range []string{"nope", testKey + "x", testKey[:len(testKey)-1], "0123456789ABCDEF0123456789ABCDEF"} {
		rec := do(r, http.MethodGet, "/api/incidents", wrong)
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("key %q = %d, want 401", wrong, rec.Code)
		}
	}
	if *hits != 0 {
		t.Error("handler ran even though every request was rejected")
	}
}

func TestCorrectKeyIsAccepted(t *testing.T) {
	r, hits := newRouter(testKey)

	if rec := do(r, http.MethodGet, "/api/incidents", testKey); rec.Code != http.StatusOK {
		t.Fatalf("GET with the right key = %d, want 200", rec.Code)
	}
	if rec := do(r, http.MethodPost, "/api/incidents/abc/approve", testKey); rec.Code != http.StatusOK {
		t.Fatalf("POST with the right key = %d, want 200", rec.Code)
	}
	if *hits != 2 {
		t.Errorf("handler ran %d times, want 2", *hits)
	}
}

func TestMutatingRouteIsProtected(t *testing.T) {
	r, hits := newRouter(testKey)

	if rec := do(r, http.MethodPost, "/api/incidents/abc/approve", ""); rec.Code != http.StatusUnauthorized {
		t.Fatalf("approve with no key = %d, want 401", rec.Code)
	}
	if *hits != 0 {
		t.Error("approve handler ran without a key")
	}
}

func TestRejectionBodyGivesNoHint(t *testing.T) {
	r, _ := newRouter(testKey)

	missing := do(r, http.MethodGet, "/api/incidents", "").Body.String()
	wrong := do(r, http.MethodGet, "/api/incidents", "wrong").Body.String()
	if missing != wrong {
		t.Errorf("missing and wrong keys get different bodies: %q vs %q", missing, wrong)
	}
}

func TestRoutesOutsideAPIStayOpen(t *testing.T) {
	r, _ := newRouter(testKey)

	for _, tc := range []struct{ method, path string }{
		{http.MethodGet, "/health"},
		{http.MethodPost, "/webhooks/github"},
		{http.MethodGet, "/github/install/callback"},
	} {
		if rec := do(r, tc.method, tc.path, ""); rec.Code != http.StatusOK {
			t.Errorf("%s %s with a key configured but none sent = %d, want 200", tc.method, tc.path, rec.Code)
		}
	}
}
