package githubapp

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// AccountDeletion counts what deleting an account removed.
type AccountDeletion struct {
	// Found is false when the account had never been stored, so there was nothing to delete.
	Found         bool `json:"found"`
	Installations int  `json:"installations"`
	Repositories  int  `json:"repositories"`
	Incidents     int  `json:"incidents"`
}

// AccountStore deletes everything stored for one GitHub account.
type AccountStore interface {
	DeleteAccount(ctx context.Context, githubUserID int64) (AccountDeletion, error)
}

// DeleteAccount removes the user, their installations, those installations' repositories, and every
// incident, action and audit entry recorded against those repositories. It runs in one transaction,
// so it either removes all of it or none. It is safe to run twice.
//
// What it does not do: it does not uninstall the GitHub App (that is done on GitHub), and it does
// not undo anything already done to a credential, such as a key that was rotated.
//
// Audit entries that merely name this user as the approver, on incidents that belong to somebody
// else, are kept with the user detached, so deleting an account never erases another account's trail.
func (s *PGStore) DeleteAccount(ctx context.Context, githubUserID int64) (AccountDeletion, error) {
	var result AccountDeletion

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return result, fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // a no-op after Commit

	var userID string
	err = tx.QueryRow(ctx, `SELECT id FROM users WHERE github_user_id = $1`, githubUserID).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return result, nil
	}
	if err != nil {
		return result, fmt.Errorf("find user: %w", err)
	}
	result.Found = true

	const mineRepos = `SELECT r.id FROM repositories r
		JOIN github_installations gi ON gi.id = r.installation_id WHERE gi.user_id = $1`
	const mineIncidents = `SELECT i.id FROM incidents i WHERE i.repository_id IN (` + mineRepos + `)`

	steps := []struct {
		name  string
		query string
		count *int
	}{
		{"actions", `DELETE FROM actions WHERE incident_id IN (` + mineIncidents + `)`, nil},
		{"audit log", `DELETE FROM audit_logs WHERE incident_id IN (` + mineIncidents + `)`, nil},
		{"incidents", `DELETE FROM incidents WHERE repository_id IN (` + mineRepos + `)`, &result.Incidents},
		{"audit attribution", `UPDATE audit_logs SET user_id = NULL WHERE user_id = $1`, nil},
		{"repositories", `DELETE FROM repositories WHERE installation_id IN
			(SELECT id FROM github_installations WHERE user_id = $1)`, &result.Repositories},
		{"installations", `DELETE FROM github_installations WHERE user_id = $1`, &result.Installations},
		{"user", `DELETE FROM users WHERE id = $1`, nil},
	}
	for _, step := range steps {
		tag, err := tx.Exec(ctx, step.query, userID)
		if err != nil {
			return AccountDeletion{}, fmt.Errorf("delete %s: %w", step.name, err)
		}
		if step.count != nil {
			*step.count = int(tag.RowsAffected())
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return AccountDeletion{}, fmt.Errorf("commit: %w", err)
	}
	return result, nil
}

// RegisterAccountRoutes wires DELETE /api/account, behind the same shared-key check as the rest of
// /api/. The dashboard calls it after it has checked the signed-in session and the confirmation.
func RegisterAccountRoutes(r *gin.Engine, store AccountStore) {
	r.DELETE("/api/account", handleDeleteAccount(store))
}

func handleDeleteAccount(store AccountStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseInt(c.Query("github_user_id"), 10, 64)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "github_user_id is required"})
			return
		}
		if store == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database unavailable"})
			return
		}

		result, err := store.DeleteAccount(c.Request.Context(), id)
		if err != nil {
			// Never returned to the caller: it can carry SQL detail.
			log.Printf("githubapp: delete account failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete the account"})
			return
		}
		log.Printf("githubapp: deleted an account (installations=%d repositories=%d incidents=%d)",
			result.Installations, result.Repositories, result.Incidents)
		c.JSON(http.StatusOK, result)
	}
}
