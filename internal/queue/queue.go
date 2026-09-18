// Package queue wraps the revokr-jobs SQS queue provisioned in Phase 0
// (see infra/notes.md), used by both cmd/api (send) and cmd/worker (receive).
package queue

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

type Client struct {
	sqs      *sqs.Client
	queueURL string
}

func New(ctx context.Context, queueURL string) (*Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}
	return &Client{sqs: sqs.NewFromConfig(cfg), queueURL: queueURL}, nil
}

func (c *Client) Send(ctx context.Context, body string) error {
	_, err := c.sqs.SendMessage(ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(c.queueURL),
		MessageBody: aws.String(body),
	})
	return err
}

// Receive long-polls for up to maxMessages jobs, waiting up to 20s for one to arrive.
func (c *Client) Receive(ctx context.Context, maxMessages int32) ([]types.Message, error) {
	out, err := c.sqs.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(c.queueURL),
		MaxNumberOfMessages: maxMessages,
		WaitTimeSeconds:     20,
	})
	if err != nil {
		return nil, err
	}
	return out.Messages, nil
}

func (c *Client) Delete(ctx context.Context, receiptHandle string) error {
	_, err := c.sqs.DeleteMessage(ctx, &sqs.DeleteMessageInput{
		QueueUrl:      aws.String(c.queueURL),
		ReceiptHandle: aws.String(receiptHandle),
	})
	return err
}
