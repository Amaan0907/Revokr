package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Amaan0907/Revokr/internal/githubapp"
	"github.com/Amaan0907/Revokr/internal/queue"
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

	var queueClient *queue.Client
	if queueURL := os.Getenv("SQS_QUEUE_URL"); queueURL != "" {
		if qc, err := queue.New(ctx, queueURL); err != nil {
			log.Printf("api: sqs client init warning: %v", err)
		} else {
			queueClient = qc
			log.Println("api: sqs queue client initialized")
		}
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	githubapp.RegisterInstallCallback(r)
	githubapp.RegisterWebhook(r, githubApp.WebhookSecret, queueClient)

	r.Run(":" + port)
}
