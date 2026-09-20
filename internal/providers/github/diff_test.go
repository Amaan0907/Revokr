package githubactions

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const sampleDiff = `diff --git a/.env b/.env
--- a/.env
+++ b/.env
@@ -1,2 +1,2 @@
 UNCHANGED=AKIAIOSFODNN7CONTEXT
-OLD=AKIAIOSFODNN7REMOVED
+NEW=AKIAIOSFODNN7ADDED
`

func TestAddedLinesKeepsOnlyAdditions(t *testing.T) {
	got := addedLines(sampleDiff)
	if got != "+NEW=AKIAIOSFODNN7ADDED" {
		t.Errorf("expected only the added line, got %q", got)
	}
}

func TestFetchCommitAdditionsSendsTokenAndAcceptHeader(t *testing.T) {
	var gotPath, gotAccept, gotAuth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotAccept, gotAuth = r.URL.Path, r.Header.Get("Accept"), r.Header.Get("Authorization")
		_, _ = w.Write([]byte(sampleDiff))
	}))
	defer server.Close()

	diff, err := fetchCommitAdditions(context.Background(), server.Client(), server.URL, "octo", "app", "abc1234", "tok")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(diff, "ADDED") || strings.Contains(diff, "REMOVED") {
		t.Errorf("unexpected diff: %q", diff)
	}
	if gotPath != "/repos/octo/app/commits/abc1234" {
		t.Errorf("unexpected path %q", gotPath)
	}
	if gotAccept != "application/vnd.github.diff" {
		t.Errorf("unexpected Accept header %q", gotAccept)
	}
	if gotAuth != "Bearer tok" {
		t.Errorf("unexpected Authorization header %q", gotAuth)
	}
}

func TestFetchCommitAdditionsWithoutTokenSendsNoAuthorization(t *testing.T) {
	var gotAuth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
	}))
	defer server.Close()

	if _, err := fetchCommitAdditions(context.Background(), server.Client(), server.URL, "octo", "app", "abc1234", ""); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotAuth != "" {
		t.Errorf("expected no Authorization header, got %q", gotAuth)
	}
}

func TestFetchCommitAdditionsRejectsBadInputAndStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	if _, err := fetchCommitAdditions(context.Background(), server.Client(), server.URL, "octo", "app", "../etc", ""); err == nil {
		t.Error("expected an error for a sha that is not hex")
	}
	if _, err := fetchCommitAdditions(context.Background(), server.Client(), server.URL, "", "app", "abc1234", ""); err == nil {
		t.Error("expected an error for an empty owner")
	}
	if _, err := fetchCommitAdditions(context.Background(), server.Client(), server.URL, "octo", "app", "abc1234", ""); err == nil {
		t.Error("expected an error for a 404 response")
	}
}
