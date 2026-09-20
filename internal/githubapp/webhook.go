package githubapp

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/Amaan0907/Revokr/internal/queue"
)

type pushPayload struct {
	Ref        string `json:"ref"`
	After      string `json:"after"`
	Repository struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		FullName string `json:"full_name"`
		Owner    struct {
			Login string `json:"login"`
			Name  string `json:"name"`
		} `json:"owner"`
		Private bool `json:"private"`
	} `json:"repository"`
	HeadCommit struct {
		ID string `json:"id"`
	} `json:"head_commit"`
	DiffContent string `json:"diff_content,omitempty"`
	Simulated   bool   `json:"simulated,omitempty"`
}

// ParsePushEvent extracts repository and commit metadata into a queue.DetectionJob.
func ParsePushEvent(body []byte) (*queue.DetectionJob, error) {
	var payload pushPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("unmarshal push payload: %w", err)
	}

	commitSHA := payload.After
	if commitSHA == "" || commitSHA == "0000000000000000000000000000000000000000" {
		commitSHA = payload.HeadCommit.ID
	}

	owner := payload.Repository.Owner.Login
	if owner == "" {
		owner = payload.Repository.Owner.Name
	}
	if owner == "" && strings.Contains(payload.Repository.FullName, "/") {
		parts := strings.SplitN(payload.Repository.FullName, "/", 2)
		owner = parts[0]
	}

	job := &queue.DetectionJob{
		RepositoryOwner: owner,
		RepositoryName:  payload.Repository.Name,
		CommitSHA:       commitSHA,
		DiffContent:     payload.DiffContent,
		IsPublic:        !payload.Repository.Private,
		Simulated:       payload.Simulated,
	}

	return job, nil
}

// RegisterWebhook wires POST /webhooks/github, rejecting any request whose
// HMAC-SHA256 signature doesn't match the App's webhook secret.
// A non-nil queue.Client enqueues detection jobs for push events; a non-nil store registers
// installations and their repositories from installation events.
func RegisterWebhook(r *gin.Engine, webhookSecret string, q *queue.Client, store InstallationStore) {
	r.POST("/webhooks/github", handleWebhook(webhookSecret, q, store))
}

func handleWebhook(webhookSecret string, q *queue.Client, store InstallationStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "could not read body"})
			return
		}

		if !verifySignature(webhookSecret, body, c.GetHeader("X-Hub-Signature-256")) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
			return
		}

		event := c.GetHeader("X-GitHub-Event")
		delivery := c.GetHeader("X-GitHub-Delivery")
		log.Printf("githubapp: webhook received (event=%s, delivery=%s, bytes=%d)", event, delivery, len(body))

		switch event {
		case "push":
			job, err := ParsePushEvent(body)
			if err != nil {
				log.Printf("githubapp: failed to parse push event: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid push payload"})
				return
			}

			if q != nil {
				if err := q.SendJob(c.Request.Context(), job); err != nil {
					log.Printf("githubapp: failed to enqueue detection job: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to enqueue job"})
					return
				}
				log.Printf("githubapp: enqueued detection job for %s/%s at commit %s",
					job.RepositoryOwner, job.RepositoryName, job.CommitSHA)
			} else {
				log.Printf("githubapp: queue not configured, detection job logged: %s/%s at commit %s",
					job.RepositoryOwner, job.RepositoryName, job.CommitSHA)
			}
		case "installation", "installation_repositories":
			change, err := ParseInstallationEvent(event, body)
			if err != nil {
				log.Printf("githubapp: failed to parse %s event: %v", event, err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid installation payload"})
				return
			}
			if change == nil {
				break
			}
			if store == nil {
				log.Printf("githubapp: no store configured, %s for installation %d ignored", event, change.InstallationID)
				break
			}
			if err := store.Apply(c.Request.Context(), change); err != nil {
				// A 500 makes GitHub show the delivery as failed so it can be redelivered.
				log.Printf("githubapp: failed to apply %s for installation %d: %v", event, change.InstallationID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record installation"})
				return
			}
			log.Printf("githubapp: recorded %s for installation %d (+%d repos, -%d repos, deleted=%t)",
				event, change.InstallationID, len(change.Add), len(change.Remove), change.Deleted)
		default:
			log.Printf("githubapp: unhandled event type: %s", event)
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

func verifySignature(secret string, body []byte, header string) bool {
	const prefix = "sha256="
	if !strings.HasPrefix(header, prefix) {
		return false
	}

	expectedMAC, err := hex.DecodeString(strings.TrimPrefix(header, prefix))
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)

	return hmac.Equal(mac.Sum(nil), expectedMAC)
}
