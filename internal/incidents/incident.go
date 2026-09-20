package incidents

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Incident mirrors a row in the PostgreSQL incidents table.
//
// ResourceRef (for AWS, the full access key id) is what remediation acts on. It
// is stored in the DB and read by the rotation steps, but is tagged json:"-" so
// it never appears in API responses.
type Incident struct {
	ID           string `json:"id"`
	RepositoryID string `json:"repository_id"`
	// RepositoryOwner and RepositoryName come from a join on repositories; they
	// are read-only and never written by Create.
	RepositoryOwner string     `json:"repository_owner"`
	RepositoryName  string     `json:"repository_name"`
	CommitSHA       string     `json:"commit_sha"`
	FilePath        string     `json:"file_path"`
	LineNumber      int        `json:"line_number"`
	Provider        string     `json:"provider"`
	SecretType      string     `json:"secret_type"`
	Fingerprint     string     `json:"fingerprint"`
	MaskedValue     string     `json:"masked_value"`
	ResourceRef     string     `json:"-"`
	IsLive          *bool      `json:"is_live,omitempty"`
	Severity        string     `json:"severity"`
	RiskScore       int        `json:"risk_score"`
	RiskFactors     any        `json:"risk_factors"`
	Status          Status     `json:"status"`
	Simulated       bool       `json:"simulated"`
	CreatedAt       time.Time  `json:"created_at"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty"`
}

// Create inserts or updates an incident row in PostgreSQL.
// Deduplication is enforced on (repository_id, fingerprint) via ON CONFLICT.
func Create(ctx context.Context, pool *pgxpool.Pool, inc *Incident) error {
	factorsJSON, err := json.Marshal(inc.RiskFactors)
	if err != nil {
		return fmt.Errorf("marshal risk factors: %w", err)
	}

	query := `
		INSERT INTO incidents (
			repository_id, commit_sha, file_path, line_number, provider,
			secret_type, fingerprint, masked_value, resource_ref, is_live, severity,
			risk_score, risk_factors, status, simulated
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
		ON CONFLICT (repository_id, fingerprint) DO UPDATE SET
			commit_sha = EXCLUDED.commit_sha,
			file_path = EXCLUDED.file_path,
			line_number = EXCLUDED.line_number,
			risk_score = EXCLUDED.risk_score,
			risk_factors = EXCLUDED.risk_factors
		RETURNING id, created_at;
	`

	return pool.QueryRow(ctx, query,
		inc.RepositoryID,
		inc.CommitSHA,
		inc.FilePath,
		inc.LineNumber,
		inc.Provider,
		inc.SecretType,
		inc.Fingerprint,
		inc.MaskedValue,
		inc.ResourceRef,
		inc.IsLive,
		inc.Severity,
		inc.RiskScore,
		factorsJSON,
		string(inc.Status),
		inc.Simulated,
	).Scan(&inc.ID, &inc.CreatedAt)
}

// List returns incidents ordered by created_at DESC with an optional limit.
func List(ctx context.Context, pool *pgxpool.Pool, limit int) ([]Incident, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := `
		SELECT i.id, i.repository_id, r.owner, r.name, i.commit_sha, i.file_path, i.line_number, i.provider,
		       i.secret_type, i.fingerprint, i.masked_value, i.resource_ref, i.is_live, i.severity,
		       i.risk_score, i.risk_factors, i.status, i.simulated, i.created_at, i.resolved_at
		FROM incidents i
		LEFT JOIN repositories r ON r.id = i.repository_id
		ORDER BY i.created_at DESC
		LIMIT $1;
	`
	rows, err := pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("query incidents: %w", err)
	}
	defer rows.Close()

	var results []Incident
	for rows.Next() {
		var inc Incident
		var factorsRaw []byte
		var statusStr string
		var resourceRef, repoOwner, repoName *string

		if err := rows.Scan(
			&inc.ID, &inc.RepositoryID, &repoOwner, &repoName, &inc.CommitSHA, &inc.FilePath, &inc.LineNumber,
			&inc.Provider, &inc.SecretType, &inc.Fingerprint, &inc.MaskedValue, &resourceRef,
			&inc.IsLive, &inc.Severity, &inc.RiskScore, &factorsRaw, &statusStr, &inc.Simulated,
			&inc.CreatedAt, &inc.ResolvedAt,
		); err != nil {
			return nil, fmt.Errorf("scan incident: %w", err)
		}

		inc.Status = Status(statusStr)
		if resourceRef != nil {
			inc.ResourceRef = *resourceRef
		}
		if repoOwner != nil {
			inc.RepositoryOwner = *repoOwner
		}
		if repoName != nil {
			inc.RepositoryName = *repoName
		}
		if len(factorsRaw) > 0 {
			var f any
			_ = json.Unmarshal(factorsRaw, &f)
			inc.RiskFactors = f
		}

		results = append(results, inc)
	}

	return results, nil
}

// GetByID fetches a single incident by its UUID.
func GetByID(ctx context.Context, pool *pgxpool.Pool, id string) (*Incident, error) {
	query := `
		SELECT i.id, i.repository_id, r.owner, r.name, i.commit_sha, i.file_path, i.line_number, i.provider,
		       i.secret_type, i.fingerprint, i.masked_value, i.resource_ref, i.is_live, i.severity,
		       i.risk_score, i.risk_factors, i.status, i.simulated, i.created_at, i.resolved_at
		FROM incidents i
		LEFT JOIN repositories r ON r.id = i.repository_id
		WHERE i.id = $1;
	`

	var inc Incident
	var factorsRaw []byte
	var statusStr string
	var resourceRef, repoOwner, repoName *string

	if err := pool.QueryRow(ctx, query, id).Scan(
		&inc.ID, &inc.RepositoryID, &repoOwner, &repoName, &inc.CommitSHA, &inc.FilePath, &inc.LineNumber,
		&inc.Provider, &inc.SecretType, &inc.Fingerprint, &inc.MaskedValue, &resourceRef,
		&inc.IsLive, &inc.Severity, &inc.RiskScore, &factorsRaw, &statusStr, &inc.Simulated,
		&inc.CreatedAt, &inc.ResolvedAt,
	); err != nil {
		return nil, fmt.Errorf("incident not found: %w", err)
	}

	inc.Status = Status(statusStr)
	if resourceRef != nil {
		inc.ResourceRef = *resourceRef
	}
	if repoOwner != nil {
		inc.RepositoryOwner = *repoOwner
	}
	if repoName != nil {
		inc.RepositoryName = *repoName
	}
	if len(factorsRaw) > 0 {
		var f any
		_ = json.Unmarshal(factorsRaw, &f)
		inc.RiskFactors = f
	}

	return &inc, nil
}

// ResolveRepositoryID finds the registered repository's UUID, or returns an error when the
// repository is not registered. Repositories are registered when the GitHub App is installed
// on them (see internal/githubapp). It deliberately does not fall back to some other
// repository: an unregistered repo must not have its incidents attached to someone else's.
func ResolveRepositoryID(ctx context.Context, pool *pgxpool.Pool, explicitID, owner, name string) (string, error) {
	if explicitID != "" {
		return explicitID, nil
	}

	var id string
	err := pool.QueryRow(ctx, "SELECT id FROM repositories WHERE owner = $1 AND name = $2 LIMIT 1", owner, name).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("no registered repository for %s/%s: %w", owner, name, err)
	}
	return id, nil
}

// RepositoryOwnerName returns a repository's owner and name by ID — the
// reverse of ResolveRepositoryID — for steps that need to call the GitHub
// API directly (e.g. the GitHub Actions secret update in rotate.go) rather
// than go through an incident's own fields.
func RepositoryOwnerName(ctx context.Context, pool *pgxpool.Pool, repositoryID string) (owner, name string, err error) {
	err = pool.QueryRow(ctx, "SELECT owner, name FROM repositories WHERE id = $1", repositoryID).Scan(&owner, &name)
	if err != nil {
		return "", "", fmt.Errorf("resolve repository owner/name for %s: %w", repositoryID, err)
	}
	return owner, name, nil
}
