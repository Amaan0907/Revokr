package queue

import (
	"encoding/json"
	"testing"
)

func TestDetectionJob_Serialization(t *testing.T) {
	job := DetectionJob{
		RepositoryOwner: "Amaan0907",
		RepositoryName:  "Revokr",
		CommitSHA:       "a1b2c3d4",
		FilePath:        ".env",
		DiffContent:     "+AKIAIOSFODNN7EXAMPLE",
		IsPublic:        true,
		Simulated:       true,
	}

	data, err := json.Marshal(job)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	var decoded DetectionJob
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}

	if decoded.RepositoryOwner != job.RepositoryOwner {
		t.Errorf("expected owner %s, got %s", job.RepositoryOwner, decoded.RepositoryOwner)
	}
	if decoded.CommitSHA != job.CommitSHA {
		t.Errorf("expected commit %s, got %s", job.CommitSHA, decoded.CommitSHA)
	}
	if !decoded.IsPublic {
		t.Errorf("expected is_public true")
	}
}
