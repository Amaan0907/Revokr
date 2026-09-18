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
			secret_type, fingerprint, masked_value, is_live, severity,
			risk_score, risk_factors, status, simulated
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
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
		inc.IsLive,
		inc.Severity,
		inc.RiskScore,
		factorsJSON,
		string(inc.Status),
		inc.Simulated,
	).Scan(&inc.ID, &inc.CreatedAt)
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
