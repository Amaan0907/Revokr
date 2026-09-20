package githubapp

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Amaan0907/Revokr/internal/incidents"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// repositorySelect is the shared body of the list and detail queries. Both add a WHERE that
// restricts the rows to one installer's repositories.
const repositorySelect = `
	SELECT r.id, r.owner, r.name, r.enabled, gi.installation_id, u.username, r.created_at,
	       (SELECT count(*) FROM incidents i
	        WHERE i.repository_id = r.id AND i.status <> 'RESOLVED')
	FROM repositories r
	JOIN github_installations gi ON gi.id = r.installation_id
	JOIN users u ON u.id = gi.user_id`

type rowScanner interface{ Scan(dest ...any) error }

func scanRepository(row rowScanner) (RepositorySummary, error) {
	var s RepositorySummary
	err := row.Scan(&s.ID, &s.Owner, &s.Name, &s.Enabled, &s.InstallationID, &s.InstalledBy, &s.RegisteredAt, &s.OpenIncidents)
	return s, err
}

// RepositorySummary is one registered repository as the dashboard lists it.
type RepositorySummary struct {
	ID             string    `json:"id"`
	Owner          string    `json:"owner"`
	Name           string    `json:"name"`
	Enabled        bool      `json:"enabled"`
	InstallationID int64     `json:"installation_id"`
	InstalledBy    string    `json:"installed_by"`
	RegisteredAt   time.Time `json:"registered_at"`
	// OpenIncidents counts incidents that are not RESOLVED.
	OpenIncidents int `json:"open_incidents"`
}

// RegisterRepositoryRoutes wires GET /api/repositories, behind the same shared-key check as the
// rest of /api/.
func RegisterRepositoryRoutes(r *gin.Engine, pool *pgxpool.Pool) {
	r.GET("/api/repositories", handleListRepositories(pool))
	r.GET("/api/repositories/:id", handleGetRepository(pool))
}

// handleListRepositories lists the repositories installed by one GitHub user. installer_github_id
// is required: the endpoint never returns everyone's repositories, so a caller that forgets the
// parameter gets an error, not somebody else's data. The dashboard fills it in from the signed-in
// session, and the shared API key is what stops anyone else from choosing a different id.
func handleListRepositories(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		installer, err := strconv.ParseInt(c.Query("installer_github_id"), 10, 64)
		if err != nil || installer <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "installer_github_id is required"})
			return
		}
		if pool == nil {
			c.JSON(http.StatusOK, gin.H{"repositories": []RepositorySummary{}})
			return
		}

		rows, err := pool.Query(c.Request.Context(), repositorySelect+`
			WHERE u.github_user_id = $1
			ORDER BY r.created_at DESC
			LIMIT 200`, installer)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list repositories"})
			return
		}
		defer rows.Close()

		list := []RepositorySummary{}
		for rows.Next() {
			s, err := scanRepository(rows)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not read repositories"})
				return
			}
			list = append(list, s)
		}
		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not read repositories"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"repositories": list})
	}
}

// handleGetRepository returns one repository and its incidents, only if it was installed by
// installer_github_id. Anything else is a 404, so the endpoint does not confirm that another
// account's repository exists.
func handleGetRepository(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		installer, err := strconv.ParseInt(c.Query("installer_github_id"), 10, 64)
		if err != nil || installer <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "installer_github_id is required"})
			return
		}
		id := c.Param("id")
		if pool == nil || !uuidPattern.MatchString(id) {
			c.JSON(http.StatusNotFound, gin.H{"error": "repository not found"})
			return
		}

		summary, err := scanRepository(pool.QueryRow(c.Request.Context(), repositorySelect+`
			WHERE r.id = $1 AND u.github_user_id = $2`, id, installer))
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "repository not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not read repository"})
			return
		}

		list, err := incidents.ListByRepository(c.Request.Context(), pool, summary.ID, 50)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not list incidents"})
			return
		}
		if list == nil {
			list = []incidents.Incident{}
		}
		c.JSON(http.StatusOK, gin.H{"repository": summary, "incidents": list})
	}
}
