package githubapp

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RegisterWebhook wires POST /webhooks/github, rejecting any request whose
// HMAC-SHA256 signature doesn't match the App's webhook secret.
func RegisterWebhook(r *gin.Engine, webhookSecret string) {
	r.POST("/webhooks/github", handleWebhook(webhookSecret))
}

func handleWebhook(webhookSecret string) gin.HandlerFunc {
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

		// TODO(phase1): parse payload by event type (push, installation, ...)
		// and enqueue a detection job onto SQS.

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
