package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Amaan0907/Revokr/internal/apiauth"
	"github.com/Amaan0907/Revokr/internal/db"
	"github.com/Amaan0907/Revokr/internal/githubapp"
	"github.com/Amaan0907/Revokr/internal/incidents"
	"github.com/Amaan0907/Revokr/internal/notifications"
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

	pool, err := db.Connect(ctx)
	if err != nil {
		log.Printf("api: db connect warning: %v (running with fallback)", err)
	} else {
		defer pool.Close()
		log.Println("api: connected to postgres database")
	}

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

	// Optional: a bad or missing notification config never stops the API.
	if settings, err := notifications.LoadSettings(ctx); err != nil {
		log.Printf("api: notifications disabled: %v", err)
	} else if settings != nil {
		incidents.SetNotifier(settings.Notifier, settings.MinSeverity)
		log.Printf("api: notifications enabled (minimum severity %s)", settings.MinSeverity)
	}

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

	// Must come before the routes: gin only applies middleware to routes
	// registered after it. Unset means open, which is what local development
	// wants, so say which mode this is; a misspelled variable name on ECS would
	// otherwise leave the API open with no sign of it.
	apiKey := os.Getenv("REVOKR_API_KEY")
	if apiKey != "" {
		log.Println("api: /api/* requires the X-Revokr-Key header")
	} else {
		log.Println("api: REVOKR_API_KEY is not set, /api/* is open")
	}
	r.Use(apiauth.Require(apiKey))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	githubapp.RegisterInstallCallback(r)
	githubapp.RegisterWebhook(r, githubApp.WebhookSecret, queueClient)
	incidents.RegisterRoutes(r, pool)

	r.Run(":" + port)
}
