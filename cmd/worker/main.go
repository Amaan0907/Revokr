package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"github.com/Amaan0907/Revokr/internal/db"
	"github.com/Amaan0907/Revokr/internal/queue"
)

func main() {
	// .env only exists in local dev; ECS gets its env vars from the task
	// definition, so a missing file here is expected and not an error.
	_ = godotenv.Load()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx)
	if err != nil {
		log.Fatalf("worker: db connect: %v", err)
	}
	defer pool.Close()

	q, err := queue.New(ctx, os.Getenv("SQS_QUEUE_URL"))
	if err != nil {
		log.Fatalf("worker: queue init: %v", err)
	}

	log.Println("worker: polling for jobs")

	for {
		select {
		case <-ctx.Done():
			log.Println("worker: shutting down")
			return
		default:
		}

		messages, err := q.Receive(ctx, 5)
		if err != nil {
			log.Printf("worker: receive error: %v", err)
			continue
		}

		for _, msg := range messages {
			log.Printf("worker: received job: %s", *msg.Body)
			// TODO: parse job, dispatch to the internal/provider adapter for
			// the credential's provider type, update internal/actions status
			// keyed by actions.IdempotencyKey before doing anything destructive.
			if err := q.Delete(ctx, *msg.ReceiptHandle); err != nil {
				log.Printf("worker: delete message error: %v", err)
			}
		}
	}
}
