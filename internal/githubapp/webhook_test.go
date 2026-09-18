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
