package githubapp

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InstallationChange is what an "installation" or "installation_repositories" webhook event
// means for our tables: who installed the App, which repositories it gained, and which it lost.
type InstallationChange struct {
	InstallationID int64
	SenderID       int64
	SenderLogin    string
	Add            []RepoRef
	Remove         []RepoRef
	// Deleted is set when the whole installation was uninstalled; all its repositories go off.
	Deleted bool
}

// RepoRef identifies a repository by the same owner/name pair the worker looks it up with.
type RepoRef struct {
	Owner string
	Name  string
}

type installationPayload struct {
	Action       string `json:"action"`
	Installation struct {
		ID int64 `json:"id"`
	} `json:"installation"`
	Sender struct {
		ID    int64  `json:"id"`
		Login string `json:"login"`
	} `json:"sender"`
	Repositories        []payloadRepo `json:"repositories"`
	RepositoriesAdded   []payloadRepo `json:"repositories_added"`
	RepositoriesRemoved []payloadRepo `json:"repositories_removed"`
}

type payloadRepo struct {
	Name     string `json:"name"`
	FullName string `json:"full_name"`
}

// ParseInstallationEvent turns an "installation" or "installation_repositories" payload into an
// InstallationChange. It returns nil, nil for actions that change nothing we store (for example
// "suspend"), so the caller can acknowledge them without touching the database.
func ParseInstallationEvent(event string, body []byte) (*InstallationChange, error) {
	var p installationPayload
	if err := json.Unmarshal(body, &p); err != nil {
		return nil, fmt.Errorf("unmarshal %s payload: %w", event, err)
	}
	if p.Installation.ID == 0 {
		return nil, fmt.Errorf("%s payload has no installation id", event)
	}

	change := &InstallationChange{
		InstallationID: p.Installation.ID,
		SenderID:       p.Sender.ID,
		SenderLogin:    p.Sender.Login,
	}

	switch event {
	case "installation":
		switch p.Action {
		case "created":
			change.Add = repoRefs(p.Repositories)
		case "deleted":
			change.Deleted = true
		default:
			return nil, nil
		}
	case "installation_repositories":
		change.Add = repoRefs(p.RepositoriesAdded)
		change.Remove = repoRefs(p.RepositoriesRemoved)
	default:
		return nil, fmt.Errorf("not an installation event: %s", event)
	}

	if !change.Deleted && change.SenderID == 0 {
		return nil, fmt.Errorf("%s payload has no sender", event)
	}
	return change, nil
}

func repoRefs(in []payloadRepo) []RepoRef {
	out := make([]RepoRef, 0, len(in))
	for _, r := range in {
		owner, name, ok := strings.Cut(r.FullName, "/")
		if !ok || owner == "" || name == "" {
			continue
		}
		out = append(out, RepoRef{Owner: owner, Name: name})
	}
	return out
}

// InstallationStore persists installation changes.
type InstallationStore interface {
	Apply(ctx context.Context, change *InstallationChange) error
}

// PGStore writes installation changes to PostgreSQL.
type PGStore struct {
	Pool *pgxpool.Pool
}

// Apply registers the installer, the installation and its repositories, or switches
// repositories off. Everything happens in one transaction, and it is safe to run twice, because
// GitHub redelivers events.
//
// Repositories are switched off rather than deleted: incidents reference them.
func (s *PGStore) Apply(ctx context.Context, c *InstallationChange) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // a no-op after Commit

	if c.Deleted {
		if _, err := tx.Exec(ctx, `
			UPDATE repositories SET enabled = false
			WHERE installation_id IN (SELECT id FROM github_installations WHERE installation_id = $1)`,
			c.InstallationID); err != nil {
			return fmt.Errorf("switch off repositories: %w", err)
		}
		return tx.Commit(ctx)
	}

	var userID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO users (github_user_id, username) VALUES ($1, $2)
		ON CONFLICT (github_user_id) DO UPDATE SET username = EXCLUDED.username
		RETURNING id`, c.SenderID, c.SenderLogin).Scan(&userID); err != nil {
		return fmt.Errorf("upsert user: %w", err)
	}

	// An existing installation keeps its original owner.
	var installationRow string
	if err := tx.QueryRow(ctx, `
		INSERT INTO github_installations (user_id, installation_id) VALUES ($1, $2)
		ON CONFLICT (installation_id) DO UPDATE SET installation_id = EXCLUDED.installation_id
		RETURNING id`, userID, c.InstallationID).Scan(&installationRow); err != nil {
		return fmt.Errorf("upsert installation: %w", err)
	}

	for _, r := range c.Add {
		// github_repo_id is a UUID column but GitHub's repository id is a number, so the column
		// gets a generated value; owner/name is what the rest of the system matches on.
		if _, err := tx.Exec(ctx, `
			INSERT INTO repositories (installation_id, github_repo_id, owner, name, enabled)
			VALUES ($1, gen_random_uuid(), $2, $3, true)
			ON CONFLICT (owner, name) DO UPDATE
			SET enabled = true, installation_id = EXCLUDED.installation_id`,
			installationRow, r.Owner, r.Name); err != nil {
			return fmt.Errorf("register %s/%s: %w", r.Owner, r.Name, err)
		}
	}
	for _, r := range c.Remove {
		if _, err := tx.Exec(ctx, `
			UPDATE repositories SET enabled = false
			WHERE owner = $1 AND name = $2 AND installation_id = $3`,
			r.Owner, r.Name, installationRow); err != nil {
			return fmt.Errorf("switch off %s/%s: %w", r.Owner, r.Name, err)
		}
	}
	return tx.Commit(ctx)
}
