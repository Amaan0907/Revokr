package queue

// DetectionJob is the SQS job payload enqueued by the GitHub webhook handler
// and consumed by cmd/worker to run secret detection and risk analysis.
type DetectionJob struct {
	RepositoryID    string `json:"repository_id,omitempty"`
	RepositoryOwner string `json:"repository_owner"`
	RepositoryName  string `json:"repository_name"`
	CommitSHA       string `json:"commit_sha"`
	FilePath        string `json:"file_path,omitempty"`
	DiffContent     string `json:"diff_content,omitempty"`
	IsPublic        bool   `json:"is_public"`
	Simulated       bool   `json:"simulated,omitempty"`
}
