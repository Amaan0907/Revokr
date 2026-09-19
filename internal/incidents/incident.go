package incidents

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Incident mirrors a row in the PostgreSQL incidents table.
type Incident struct {
	ID           string     `json:"id"`
	RepositoryID string     `json:"repository_id"`
	CommitSHA    string     `json:"commit_sha"`
	FilePath     string     `json:"file_path"`
	LineNumber   int        `json:"line_number"`
	Provider     string     `json:"provider"`
	SecretType   string     `json:"secret_type"`
	Fingerprint  string     `json:"fingerprint"`
	MaskedValue  string     `json:"masked_value"`
	ResourceRef  string     `json:"resource_ref,omitempty"`
	IsLive       *bool      `json:"is_live,omitempty"`
	Severity     string     `json:"severity"`
	RiskScore    int        `json:"risk_score"`
	RiskFactors  any        `json:"risk_factors"`
	Status       Status     `json:"status"`
	Simulated    bool       `json:"simulated"`
	CreatedAt    time.Time  `json:"created_at"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
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
		SELECT id, repository_id, commit_sha, file_path, line_number, provider,
		       secret_type, fingerprint, masked_value, resource_ref, is_live, severity,
		       risk_score, risk_factors, status, simulated, created_at, resolved_at
		FROM incidents
		ORDER BY created_at DESC
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
		var resourceRef *string

		if err := rows.Scan(
			&inc.ID, &inc.RepositoryID, &inc.CommitSHA, &inc.FilePath, &inc.LineNumber,
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
		SELECT id, repository_id, commit_sha, file_path, line_number, provider,
		       secret_type, fingerprint, masked_value, resource_ref, is_live, severity,
		       risk_score, risk_factors, status, simulated, created_at, resolved_at
		FROM incidents
		WHERE id = $1;
	`

	var inc Incident
	var factorsRaw []byte
	var statusStr string
	var resourceRef *string

	if err := pool.QueryRow(ctx, query, id).Scan(
		&inc.ID, &inc.RepositoryID, &inc.CommitSHA, &inc.FilePath, &inc.LineNumber,
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
	if len(factorsRaw) > 0 {
		var f any
		_ = json.Unmarshal(factorsRaw, &f)
		inc.RiskFactors = f
	}

	return &inc, nil
}

// ResolveRepositoryID finds an existing repository UUID or returns an error.
func ResolveRepositoryID(ctx context.Context, pool *pgxpool.Pool, explicitID, owner, name string) (string, error) {
	if explicitID != "" {
		return explicitID, nil
	}

	var id string
	err := pool.QueryRow(ctx, "SELECT id FROM repositories WHERE owner = $1 AND name = $2 LIMIT 1", owner, name).Scan(&id)
	if err == nil {
		return id, nil
	}

	// Fallback to any configured repository for testing/local setups
	err = pool.QueryRow(ctx, "SELECT id FROM repositories LIMIT 1").Scan(&id)
	if err == nil {
		return id, nil
	}

	return "", fmt.Errorf("no repository found for %s/%s", owner, name)
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
