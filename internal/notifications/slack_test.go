package notifications

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func sampleMessage() Message {
	return Message{
		Repository: "acme/payments-api",
		Provider:   "aws",
		CommitSHA:  "4e1a9c7d2b8f0a6c5e3d1b9a7f5c3e1d2b4a6c8e",
		RiskScore:  96,
		Severity:   "CRITICAL",
		Status:     "AWAITING_APPROVAL",
	}
}

// capture starts a server that records the last request body.
func capture(t *testing.T, status int) (*httptest.Server, *string) {
	t.Helper()
	var body string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		body = string(b)
		w.WriteHeader(status)
	}))
	t.Cleanup(srv.Close)
	return srv, &body
}

func TestSlackPostsTheAllowedFieldsAndNothingElse(t *testing.T) {
	srv, body := capture(t, http.StatusOK)

	if err := NewSlack(srv.URL).Send(context.Background(), sampleMessage()); err != nil {
		t.Fatalf("Send: %v", err)
	}

	var payload slackPayload
	if err := json.Unmarshal([]byte(*body), &payload); err != nil {
		t.Fatalf("body is not valid slack json: %v", err)
	}
	text := *body
	for _, want := range []string{"acme/payments-api", "aws", "`4e1a9c7`", "96/100", "CRITICAL", "Awaiting approval"} {
		if !strings.Contains(text, want) {
			t.Errorf("message should contain %q\n%s", want, text)
		}
	}
	// Only the short commit is shown, never the full hash.
	if strings.Contains(text, "4e1a9c7d2b8f") {
		t.Error("message should only carry the 7-character commit")
	}
}

func TestSlackLabelsSimulatedIncidents(t *testing.T) {
	srv, body := capture(t, http.StatusOK)
	m := sampleMessage()
	m.Simulated = true

	if err := NewSlack(srv.URL).Send(context.Background(), m); err != nil {
		t.Fatalf("Send: %v", err)
	}
	if !strings.Contains(*body, "[SIMULATION]") {
		t.Errorf("a simulated incident must be labelled\n%s", *body)
	}
}

func TestSlackEscapesMarkup(t *testing.T) {
	m := sampleMessage()
	m.Repository = "a<@channel>&b"

	payload := buildSlackPayload(m)
	raw, _ := json.Marshal(payload)
	var decoded slackPayload
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatal(err)
	}
	joined := decoded.Text
	for _, b := range decoded.Blocks {
		for _, f := range b.Fields {
			joined += "\n" + f.Text
		}
	}
	if strings.Contains(joined, "<@channel>") {
		t.Error("repository text must not be able to trigger a Slack mention")
	}
	if !strings.Contains(joined, "&lt;@channel&gt;&amp;b") {
		t.Errorf("expected the markup to be escaped, got:\n%s", joined)
	}
}

func TestSlackReportsNon2xxAsAnError(t *testing.T) {
	srv, _ := capture(t, http.StatusInternalServerError)

	err := NewSlack(srv.URL).Send(context.Background(), sampleMessage())
	if err == nil || !strings.Contains(err.Error(), "500") {
		t.Fatalf("expected an error mentioning status 500, got %v", err)
	}
}

func TestSlackErrorsNeverContainTheWebhookURL(t *testing.T) {
	srv, _ := capture(t, http.StatusOK)
	webhook := srv.URL + "/services/T000/B000/SECRETTOKEN"
	srv.Close() // so the request fails at the network layer

	err := NewSlack(webhook).Send(context.Background(), sampleMessage())
	if err == nil {
		t.Fatal("expected an error from a closed server")
	}
	if strings.Contains(err.Error(), "SECRETTOKEN") {
		t.Errorf("error leaks the webhook credential: %v", err)
	}
}

func TestUnknownStatusStillProducesAMessage(t *testing.T) {
	m := sampleMessage()
	m.Status = "SOMETHING_NEW"
	payload := buildSlackPayload(m)
	if !strings.Contains(payload.Text, "Incident update") {
		t.Errorf("unknown status should fall back to a generic headline, got %q", payload.Text)
	}
}

func TestMeetsSeverity(t *testing.T) {
	cases := []struct {
		severity, minimum string
		want              bool
	}{
		{"CRITICAL", "CRITICAL", true},
		{"HIGH", "CRITICAL", false},
		{"HIGH", "HIGH", true},
		{"CRITICAL", "LOW", true},
		{"LOW", "MEDIUM", false},
		{"NONSENSE", "LOW", false},
	}
	for _, c := range cases {
		if got := MeetsSeverity(c.severity, c.minimum); got != c.want {
			t.Errorf("MeetsSeverity(%q, %q) = %t, want %t", c.severity, c.minimum, got, c.want)
		}
	}
}
