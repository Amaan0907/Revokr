package notifications

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"

	"github.com/Amaan0907/Revokr/internal/secrets"
)

// DefaultMinSeverity matches the plan's gate: a critical incident posts a
// notification. Lower it with NOTIFY_MIN_SEVERITY to hear about more.
const DefaultMinSeverity = "CRITICAL"

// Settings is a ready-to-use notifier plus the severity threshold to apply.
type Settings struct {
	Notifier    Notifier
	MinSeverity string
}

// LoadSettings reads the notification config from the environment.
//
//	NOTIFICATION_WEBHOOK_SECRET_ARN  Secrets Manager secret holding the Slack webhook URL
//	NOTIFICATION_WEBHOOK_URL         the URL directly, for local development only
//	NOTIFY_MIN_SEVERITY              LOW | MEDIUM | HIGH | CRITICAL (default CRITICAL)
//
// With neither webhook variable set it returns (nil, nil): notifications are
// optional, and leaving them unconfigured is not an error. The webhook URL is
// a credential, so production reads it from Secrets Manager like the other
// app secrets; the plain variable exists only so it can be tried locally.
func LoadSettings(ctx context.Context) (*Settings, error) {
	minSeverity := strings.ToUpper(strings.TrimSpace(os.Getenv("NOTIFY_MIN_SEVERITY")))
	if minSeverity == "" {
		minSeverity = DefaultMinSeverity
	}
	if !ValidSeverity(minSeverity) {
		return nil, fmt.Errorf("NOTIFY_MIN_SEVERITY must be LOW, MEDIUM, HIGH or CRITICAL, got %q", minSeverity)
	}

	webhookURL := strings.TrimSpace(os.Getenv("NOTIFICATION_WEBHOOK_URL"))
	if webhookURL == "" {
		arn := strings.TrimSpace(os.Getenv("NOTIFICATION_WEBHOOK_SECRET_ARN"))
		if arn == "" {
			return nil, nil
		}
		client, err := secrets.New(ctx)
		if err != nil {
			return nil, fmt.Errorf("notifications: secrets client: %w", err)
		}
		webhookURL, err = client.Get(ctx, arn)
		if err != nil {
			return nil, fmt.Errorf("notifications: load webhook url: %w", err)
		}
		webhookURL = strings.TrimSpace(webhookURL)
	}

	if err := validateWebhookURL(webhookURL); err != nil {
		return nil, err
	}
	return &Settings{Notifier: NewSlack(webhookURL), MinSeverity: minSeverity}, nil
}

// validateWebhookURL only accepts a Slack webhook over HTTPS. Its errors never
// repeat the URL, since the URL is the credential.
func validateWebhookURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return errors.New("notifications: webhook url is not a valid URL")
	}
	if u.Scheme != "https" {
		return errors.New("notifications: webhook url must use https")
	}
	if u.Host != "hooks.slack.com" {
		return errors.New("notifications: webhook url must be a hooks.slack.com Slack incoming webhook")
	}
	return nil
}
