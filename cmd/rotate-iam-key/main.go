package main

import (
	"context"
	"flag"
	"log"
	"os"

	awsiam "github.com/Amaan0907/Revokr/internal/providers/aws"
)

func main() {
	targetUser := flag.String("target-user", "", "IAM username whose key is being rotated (required)")
	oldKeyID := flag.String("old-key-id", "", "access key id to disable (required for diable-verify)")
	step := flag.String("step", "create-validate", "create-validate | disable-verify")
	flag.Parse()

	if *targetUser == "" {
		log.Fatal("-target-user is required")
	}

	ctx := context.Background()
	client, err := awsiam.NewClient(ctx)
	if err != nil {
		log.Fatalf("failed to build AWS client: %v", err)
	}

	switch *step {
	case "create-validate":
		newKey, err := client.CreateReplacementKey(ctx, *targetUser)
		if err != nil {
			log.Fatalf("create failed: %v", err)
		}
		log.Printf("created new key: %s:", newKey.AccessKeyID)

		if err := awsiam.ValidateKey(ctx, client.Region(), newKey.AccessKeyID, newKey.SecretAccessKey); err != nil {
			log.Fatalf("validate failed: %v", err)
		}
		log.Println("SUCCESS: new key created and validated. Old key NOT Touched")
		log.Printf("new AccessKeyId=%s (save for the disable-verify step)", newKey.AccessKeyID)

	case "disable-verify":
		if *oldKeyID == "" {
			log.Fatal("-old-key-id is required for disable-verify")
		}
		if err := client.DeactivateOldKey(ctx, *targetUser, *oldKeyID); err != nil {
			log.Fatalf("deactivate failed: %v", err)
		}
		log.Println("old key deactivated")

		//Rehearsal only: the old secret is passed via env var so it never
		//lands in shell history or logs. Real remediation flow (phase 8)
		//never needs the operator to hold a raw secret like this at all.

		oldSecret := os.Getenv("OLD_SECRET_ACCESS_KEY")
		if oldSecret == "" {
			log.Println("set OLD_SECRET_ACCESS_KEY to also verify it's dead; skipping verify")
			return
		}
		if err := awsiam.VerifyKeyIsDead(ctx, client.Region(), *oldKeyID, oldSecret); err != nil {
			log.Fatalf("verify failed: %v", err)
		}
		log.Println("SUCCESS: old key confirmed dead")

	default:
		log.Fatalf("unkown -step %q", *step)

	}
}
