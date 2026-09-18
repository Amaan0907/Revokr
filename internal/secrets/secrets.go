// Package secrets fetches GitHub App credentials from AWS Secrets Manager at
// runtime, using the ARNs set in .env (GITHUB_APP_PRIVATE_KEY_SECRET_ARN,
// GITHUB_WEBHOOK_SECRET_ARN) — the credential values themselves never touch
// .env, disk, or version control.
package secrets

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type Client struct {
	sm *secretsmanager.Client
}

func New(ctx context.Context) (*Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}
	return &Client{sm: secretsmanager.NewFromConfig(cfg)}, nil
}

// Get fetches a secret's plaintext value by ARN.
func (c *Client) Get(ctx context.Context, arn string) (string, error) {
	if arn == "" {
		return "", fmt.Errorf("secrets: empty ARN")
	}
	out, err := c.sm.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &arn,
	})
	if err != nil {
		return "", fmt.Errorf("get secret value: %w", err)
	}
	if out.SecretString == nil {
		return "", fmt.Errorf("secrets: %s has no SecretString", arn)
	}
	return *out.SecretString, nil
}

// GitHubApp holds the two GitHub App credentials the API needs at runtime.
type GitHubApp struct {
	PrivateKeyPEM string
	WebhookSecret string
}

// LoadGitHubApp fetches both GitHub App secrets using the ARNs from env vars
// GITHUB_APP_PRIVATE_KEY_SECRET_ARN and GITHUB_WEBHOOK_SECRET_ARN.
func (c *Client) LoadGitHubApp(ctx context.Context) (GitHubApp, error) {
	privateKey, err := c.Get(ctx, os.Getenv("GITHUB_APP_PRIVATE_KEY_SECRET_ARN"))
	if err != nil {
		return GitHubApp{}, fmt.Errorf("load private key: %w", err)
	}
	webhookSecret, err := c.Get(ctx, os.Getenv("GITHUB_WEBHOOK_SECRET_ARN"))
	if err != nil {
		return GitHubApp{}, fmt.Errorf("load webhook secret: %w", err)
	}
	return GitHubApp{PrivateKeyPEM: privateKey, WebhookSecret: webhookSecret}, nil
}
