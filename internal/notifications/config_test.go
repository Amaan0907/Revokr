package notifications

import (
	"context"
	"strings"
	"testing"
)

// clearEnv blanks every variable LoadSettings reads, so a developer's real
// shell environment can't change what these tests see.
func clearEnv(t *testing.T) {
	t.Helper()
	t.Setenv("NOTIFICATION_WEBHOOK_URL", "")
	t.Setenv("NOTIFICATION_WEBHOOK_SECRET_ARN", "")
	t.Setenv("NOTIFY_MIN_SEVERITY", "")
}

func TestLoadSettingsIsOffWithoutAWebhook(t *testing.T) {
	clearEnv(t)

	settings, err := LoadSettings(context.Background())
	if err != nil || settings != nil {
		t.Fatalf("LoadSettings = (%v, %v), want (nil, nil): notifications are optional", settings, err)
	}
}

func TestLoadSettingsAcceptsASlackWebhook(t *testing.T) {
	clearEnv(t)
	t.Setenv("NOTIFICATION_WEBHOOK_URL", "https://hooks.slack.com/services/T000/B000/XXXX")

	settings, err := LoadSettings(context.Background())
	if err != nil {
		t.Fatalf("LoadSettings: %v", err)
	}
	if settings == nil || settings.Notifier == nil {
		t.Fatal("expected a notifier")
	}
	if settings.MinSeverity != DefaultMinSeverity {
		t.Errorf("MinSeverity = %q, want the default %q", settings.MinSeverity, DefaultMinSeverity)
	}
}

func TestLoadSettingsNormalisesTheSeverity(t *testing.T) {
	clearEnv(t)
	t.Setenv("NOTIFICATION_WEBHOOK_URL", "https://hooks.slack.com/services/T000/B000/XXXX")
	t.Setenv("NOTIFY_MIN_SEVERITY", " high ")

	settings, err := LoadSettings(context.Background())
	if err != nil {
		t.Fatalf("LoadSettings: %v", err)
	}
	if settings.MinSeverity != "HIGH" {
		t.Errorf("MinSeverity = %q, want HIGH", settings.MinSeverity)
	}
}

func TestLoadSettingsRejectsABadSeverity(t *testing.T) {
	clearEnv(t)
	t.Setenv("NOTIFICATION_WEBHOOK_URL", "https://hooks.slack.com/services/T000/B000/XXXX")
	t.Setenv("NOTIFY_MIN_SEVERITY", "URGENT")

	if _, err := LoadSettings(context.Background()); err == nil {
		t.Fatal("expected an error for an unknown severity")
	}
}

func TestLoadSettingsRejectsUnsafeWebhooksWithoutEchoingThem(t *testing.T) {
	for _, bad := range []string{
		"http://hooks.slack.com/services/T/B/SECRETTOKEN",         // not https
		"https://discord.com/api/webhooks/1/SECRETTOKEN",          // not Slack
		"https://evil.example.com/hooks.slack.com/SECRETTOKEN",    // wrong host
		"https://hooks.slack.com.evil.example/services/SECRETTOKEN", // lookalike host
	} {
		clearEnv(t)
		t.Setenv("NOTIFICATION_WEBHOOK_URL", bad)

		_, err := LoadSettings(context.Background())
		if err == nil {
			t.Errorf("expected %q to be rejected", bad)
			continue
		}
		if strings.Contains(err.Error(), "SECRETTOKEN") {
			t.Errorf("error for %q leaks the credential: %v", bad, err)
		}
	}
}
