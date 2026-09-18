package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Amaan0907/Revokr/internal/secrets"
)

func main() {
	// .env only exists in local dev; ECS gets its env vars from the task
	// definition, so a missing file here is expected and not an error.
	_ = godotenv.Load()

	port := os.Getenv("PORT")

	if port == "" {
		port = "3000"
	}

	ctx := context.Background()

	secretsClient, err := secrets.New(ctx)
	if err != nil {
		log.Fatalf("api: secrets client: %v", err)
	}

	githubApp, err := secretsClient.LoadGitHubApp(ctx)
	if err != nil {
		log.Fatalf("api: load github app secrets: %v", err)
	}
	log.Printf("api: github app secrets loaded (private key len=%d bytes, webhook secret set=%t)",
		len(githubApp.PrivateKeyPEM), githubApp.WebhookSecret != "")

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// TODO(checkpoint 13): install callback route, uses githubApp.PrivateKeyPEM
	// TODO(checkpoint 14): webhook route, verifies signatures with githubApp.WebhookSecret

	r.Run(":" + port)
}