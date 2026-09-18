package main

import (
	"context"
	"flag"
	"log"
	"os"

	githubactions "github.com/Amaan0907/Revokr/internal/providers/github"
)

func main() {
	owner := flag.String("owner", "", "GitHub repo owner (required)")
	repo := flag.String("repo", "", "GitHub repo name (required)")
	secretName := flag.String("secret-name", "", "Actions secret name to create/update (required)")
	flag.Parse()

	if *owner == "" || *repo == "" || *secretName == "" {
		log.Fatal("-owner, -repo, and -secret-name are required")
	}

	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		log.Fatal("set GITHUB_TOKEN env var")
	}
	secretValue := os.Getenv("SECRET_VALUE")
	if secretValue == "" {
		log.Fatal("set SECRET_VALUE env var")
	}

	ctx := context.Background()
	client := githubactions.NewClient(*owner, *repo, token)

	before, err := client.GetSecretMeta(ctx, *secretName)
	if err != nil {
		log.Fatalf("check existing secret failed: %v", err)
	}

	if err := client.PutSecret(ctx, *secretName, secretValue); err != nil {
		log.Fatalf("update secret failed: %v", err)
	}
	log.Println("PUT succeeded")

	after, err := client.GetSecretMeta(ctx, *secretName)
	if err != nil {
		log.Fatalf("verify fetch failed: %v", err)
	}

	if before != nil && before.UpdatedAt == after.UpdatedAt {
		log.Fatal("secret updated_at did not change - update may not have applied")
	}
	log.Printf("SUCCESS: secret %q updated_at is now %s", *secretName, after.UpdatedAt)
}
