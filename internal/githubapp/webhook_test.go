package githubapp

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"
)

func TestParsePushEvent(t *testing.T) {
	payload := []byte(`{
		"ref": "refs/heads/main",
		"after": "abc1234567890",
		"repository": {
			"id": 42,
			"name": "Revokr",
			"full_name": "Amaan0907/Revokr",
			"owner": {
				"login": "Amaan0907"
			},
			"private": false
		},
		"diff_content": "+AKIAIOSFODNN7EXAMPLE"
	}`)

	job, err := ParsePushEvent(payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if job.RepositoryOwner != "Amaan0907" {
		t.Errorf("expected owner Amaan0907, got %s", job.RepositoryOwner)
	}
	if job.RepositoryName != "Revokr" {
		t.Errorf("expected repo Revokr, got %s", job.RepositoryName)
	}
	if job.CommitSHA != "abc1234567890" {
		t.Errorf("expected commit abc1234567890, got %s", job.CommitSHA)
	}
	if !job.IsPublic {
		t.Errorf("expected is_public true")
	}
	if job.DiffContent != "+AKIAIOSFODNN7EXAMPLE" {
		t.Errorf("expected diff content")
	}
}

func TestVerifySignature(t *testing.T) {
	secret := "test-secret"
	body := []byte(`{"hello":"world"}`)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	sig := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	if !verifySignature(secret, body, sig) {
		t.Errorf("expected signature to verify")
	}

	if verifySignature("wrong-secret", body, sig) {
		t.Errorf("expected wrong secret to fail")
	}
}

func TestParseInstallationEventCreated(t *testing.T) {
	body := []byte(`{
		"action": "created",
		"installation": {"id": 555},
		"sender": {"id": 9, "login": "octo"},
		"repositories": [
			{"name": "app", "full_name": "octo/app"},
			{"name": "bad", "full_name": "no-slash"}
		]
	}`)

	change, err := ParseInstallationEvent("installation", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if change.InstallationID != 555 || change.SenderID != 9 || change.SenderLogin != "octo" {
		t.Errorf("unexpected installer/installation: %+v", change)
	}
	if len(change.Add) != 1 || change.Add[0] != (RepoRef{Owner: "octo", Name: "app"}) {
		t.Errorf("expected only octo/app, got %+v", change.Add)
	}
}

func TestParseInstallationEventRepositoriesChanged(t *testing.T) {
	body := []byte(`{
		"action": "added",
		"installation": {"id": 555},
		"sender": {"id": 9, "login": "octo"},
		"repositories_added": [{"name": "new", "full_name": "octo/new"}],
		"repositories_removed": [{"name": "old", "full_name": "octo/old"}]
	}`)

	change, err := ParseInstallationEvent("installation_repositories", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(change.Add) != 1 || change.Add[0].Name != "new" {
		t.Errorf("expected octo/new added, got %+v", change.Add)
	}
	if len(change.Remove) != 1 || change.Remove[0].Name != "old" {
		t.Errorf("expected octo/old removed, got %+v", change.Remove)
	}
}

func TestParseInstallationEventDeletedAndIgnored(t *testing.T) {
	deleted, err := ParseInstallationEvent("installation", []byte(`{"action":"deleted","installation":{"id":555}}`))
	if err != nil || deleted == nil || !deleted.Deleted {
		t.Fatalf("expected a deleted change, got %+v, %v", deleted, err)
	}

	ignored, err := ParseInstallationEvent("installation", []byte(`{"action":"suspend","installation":{"id":555},"sender":{"id":9}}`))
	if err != nil || ignored != nil {
		t.Errorf("suspend should change nothing, got %+v, %v", ignored, err)
	}

	if _, err := ParseInstallationEvent("installation", []byte(`{"action":"created","sender":{"id":9}}`)); err == nil {
		t.Error("expected an error when the installation id is missing")
	}
	if _, err := ParseInstallationEvent("installation", []byte(`{"action":"created","installation":{"id":1}}`)); err == nil {
		t.Error("expected an error when the sender is missing")
	}
}
