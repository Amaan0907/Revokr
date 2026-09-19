package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Slack posts to a Slack incoming webhook.
type Slack struct {
	webhookURL string
	client     *http.Client
}

// NewSlack builds a Slack notifier. The webhook URL is a credential — anyone
// holding it can post to the channel — so it lives in Secrets Manager and is
// kept out of every error this package returns (see withoutURL).
func NewSlack(webhookURL string) *Slack {
	return &Slack{webhookURL: webhookURL, client: &http.Client{Timeout: 5 * time.Second}}
}

type statusInfo struct {
	emoji    string
	headline string
	label    string
}

// The statuses worth interrupting a person for: something needs them, or the
// incident has finished one way or another.
var statuses = map[string]statusInfo{
	"AWAITING_APPROVAL":    {":warning:", "Approval needed", "Awaiting approval"},
	"RESOLVED":             {":white_check_mark:", "Incident resolved", "Resolved"},
	"FAILED":               {":x:", "Remediation failed", "Failed"},
	"REQUIRES_USER_ACTION": {":raised_hand:", "Manual action needed", "Needs action"},
	"NOT_SUPPORTED":        {":no_entry_sign:", "Can't be fixed automatically", "Not supported"},
}

func infoFor(status string) statusInfo {
	if info, ok := statuses[status]; ok {
		return info
	}
	return statusInfo{":information_source:", "Incident update", status}
}

type slackText struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type slackBlock struct {
	Type   string      `json:"type"`
	Text   *slackText  `json:"text,omitempty"`
	Fields []slackText `json:"fields,omitempty"`
}

type slackPayload struct {
	Text   string       `json:"text"` // shown in push notifications and where blocks aren't supported
	Blocks []slackBlock `json:"blocks"`
}

var slackEscaper = strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")

// escape stops repository or provider text from being read as Slack markup
// (mentions, links) — Slack only needs these three characters escaped.
func escape(s string) string { return slackEscaper.Replace(s) }

func shortSHA(sha string) string {
	if len(sha) > 7 {
		return sha[:7]
	}
	return sha
}

func buildSlackPayload(m Message) slackPayload {
	info := infoFor(m.Status)
	prefix := ""
	if m.Simulated {
		prefix = "[SIMULATION] "
	}

	field := func(name, value string) slackText {
		return slackText{Type: "mrkdwn", Text: "*" + name + "*\n" + value}
	}

	return slackPayload{
		Text: fmt.Sprintf("%sRevokr: %s — %s (%s, risk %d)",
			prefix, info.headline, escape(m.Repository), escape(m.Provider), m.RiskScore),
		Blocks: []slackBlock{
			{
				Type: "section",
				Text: &slackText{Type: "mrkdwn", Text: fmt.Sprintf("%s *%s%s*", info.emoji, prefix, info.headline)},
			},
			{
				Type: "section",
				Fields: []slackText{
					field("Repository", escape(m.Repository)),
					field("Provider", escape(m.Provider)),
					field("Commit", "`"+escape(shortSHA(m.CommitSHA))+"`"),
					field("Risk", fmt.Sprintf("%d/100 · %s", m.RiskScore, escape(m.Severity))),
					field("Status", info.label),
				},
			},
		},
	}
}

// withoutURL drops the request URL that net/http wraps into its errors, so the
// webhook credential can't end up in a log line.
func withoutURL(err error) error {
	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		return urlErr.Err
	}
	return err
}

// Send posts one message. It makes a single attempt: retrying is left to the
// caller, and remediation never waits on it.
func (s *Slack) Send(ctx context.Context, m Message) error {
	body, err := json.Marshal(buildSlackPayload(m))
	if err != nil {
		return fmt.Errorf("encode slack message: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build slack request: %w", withoutURL(err))
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("post to slack: %w", withoutURL(err))
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<16))

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("slack returned status %d", resp.StatusCode)
	}
	return nil
}

var _ Notifier = (*Slack)(nil)
