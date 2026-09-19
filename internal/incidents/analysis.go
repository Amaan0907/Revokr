package incidents

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/bedrock"
)

// handleGetAnalysis runs an incident through the AI Incident Analyst and
// returns the result. Only whitelisted, non-secret fields ever leave this
// function's scope — see bedrock.SanitizedIncident for exactly what that is.
func handleGetAnalysis(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if pool == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not connected"})
			return
		}

		inc, err := GetByID(c.Request.Context(), pool, id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		owner, name := repositoryOwnerAndName(c.Request.Context(), pool, inc.RepositoryID)

		sanitized := bedrock.SanitizedIncident{
			Provider:        inc.Provider,
			SecretType:      inc.SecretType,
			Fingerprint:     inc.Fingerprint,
			MaskedValue:     inc.MaskedValue,
			IsLive:          inc.IsLive,
			Severity:        inc.Severity,
			RiskScore:       inc.RiskScore,
			RiskFactors:     toBedrockRiskFactors(inc.RiskFactors),
			Status:          string(inc.Status),
			Simulated:       inc.Simulated,
			RepositoryOwner: owner,
			RepositoryName:  name,
			FilePath:        inc.FilePath,
			LineNumber:      inc.LineNumber,
			CommitSHA:       inc.CommitSHA,
		}

		analysis, err := bedrock.NewAnalyzer().Analyze(sanitized)
		if err != nil {
			// NewAnalyzer() already falls back to the template internally, so
			// reaching this means even the template failed - not expected in
			// practice, but reflected honestly rather than faked.
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, analysis)
	}
}

// repositoryOwnerAndName is best-effort: an incident whose repository lookup
// fails still gets an analysis, just without those two fields filled in.
func repositoryOwnerAndName(ctx context.Context, pool *pgxpool.Pool, repositoryID string) (owner, name string) {
	_ = pool.QueryRow(ctx, "SELECT owner, name FROM repositories WHERE id = $1", repositoryID).Scan(&owner, &name)
	return owner, name
}

// toBedrockRiskFactors re-decodes incidents.risk_factors (scanned into `any`
// as generic JSON) into the typed shape bedrock.SanitizedIncident expects.
func toBedrockRiskFactors(raw any) []bedrock.RiskFactor {
	if raw == nil {
		return nil
	}
	data, err := json.Marshal(raw)
	if err != nil {
		return nil
	}
	var factors []bedrock.RiskFactor
	_ = json.Unmarshal(data, &factors)
	return factors
}
