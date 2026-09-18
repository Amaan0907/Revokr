package awsiam

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	iamtypes "github.com/aws/aws-sdk-go-v2/service/iam/types"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// Client authenticates as the "manager" identity - the one allowed to
// create/disable access keys for a target IAM user. It must never be
// AdministratorAccess; scope it with a permissions boundary in AWS.
type Client struct {
	iamClient *iam.Client
	region    string
}

// NewClient loads credentials from the environment (env vars or
// ~/.aws/credentials) via the default AWS credential chain.
func NewClient(ctx context.Context) (*Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}
	return &Client{iamClient: iam.NewFromConfig(cfg), region: cfg.Region}, nil
}

func (c *Client) Region() string { return c.region }

// NewAccessKey holds a freshly created key. AWS only ever returns the
// secret at creation time, so the caller must use or store it immediately.
type NewAccessKey struct {
	AccessKeyID     string
	SecretAccessKey string
}

// CreateReplacementKey is step 1 of the fixed ordering:
// create -> validate -> update destination -> verify -> disable old -> verify.
// Never disable the old key before this succeeds and ValidateKey confirms it.
func (c *Client) CreateReplacementKey(ctx context.Context, targetUsername string) (*NewAccessKey, error) {
	out, err := c.iamClient.CreateAccessKey(ctx, &iam.CreateAccessKeyInput{
		UserName: aws.String(targetUsername),
	})
	if err != nil {
		return nil, fmt.Errorf("create access key for %s: %w", targetUsername, err)
	}
	return &NewAccessKey{
		AccessKeyID:     aws.ToString(out.AccessKey.AccessKeyId),
		SecretAccessKey: aws.ToString(out.AccessKey.SecretAccessKey),
	}, nil
}

// ValidateKey is step 2: proves the key pair actually works by using IT
// (not the manager's credentials) to call sts:GetCallerIdentity.
func ValidateKey(ctx context.Context, region, accessKeyID, secretAccessKey string) error {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
		),
	)
	if err != nil {
		return fmt.Errorf("build validation config: %w", err)
	}

	identity, err := sts.NewFromConfig(cfg).GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return fmt.Errorf("key does not work: %w", err)
	}
	fmt.Printf("validated key belongs to: %s\n", aws.ToString(identity.Arn))
	return nil
}

// DeactivateOldKey is the later, separate disable step. Never call this
// before CreateReplacementKey + ValidateKey have both already succeeded.
func (c *Client) DeactivateOldKey(ctx context.Context, targetUsername, oldAccessKeyID string) error {
	_, err := c.iamClient.UpdateAccessKey(ctx, &iam.UpdateAccessKeyInput{
		UserName:    aws.String(targetUsername),
		AccessKeyId: aws.String(oldAccessKeyID),
		Status:      iamtypes.StatusTypeInactive,
	})
	if err != nil {
		return fmt.Errorf("deactivate old key %s: %w", oldAccessKeyID, err)
	}
	return nil
}

// VerifyKeyIsDead closes the loop: the same GetCallerIdentity call should
// now fail for the disabled key. IAM is eventually consistent, so a
// just-disabled key can keep working for a few seconds - retry until AWS
// actually rejects it.
func VerifyKeyIsDead(ctx context.Context, region, accessKeyID, secretAccessKey string) error {
	for attempt := 1; attempt <= 5; attempt++ {
		if err := ValidateKey(ctx, region, accessKeyID, secretAccessKey); err != nil {
			fmt.Printf("confirmed old key is dead: %v\n", err)
			return nil
		}
		fmt.Printf("verify attempt %d: old key still works (deactivation propagation delay is normal), retrying in 5s\n", attempt)
		time.Sleep(5 * time.Second)
	}
	return fmt.Errorf("old key %s still works after retries - it should have been rejected", accessKeyID)
}
