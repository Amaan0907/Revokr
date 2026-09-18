package actions

import "fmt"

type Type string

const (
	TypeValidateCredential   Type = "VALIDATE_CREDENTIAL"
	TypeRotateCredential     Type = "ROTATE_CREDENTIAL"
	TypeUpdateGithubSecret   Type = "UPDATE_GITHUB_SECRET"
	TypeDisableOldCredential Type = "DISABLE_OLD_CREDENTIAL"
	TypeSendNotification     Type = "SEND_NOTIFICATION"
	TypeCleanHistory         Type = "CLEAN_HISTORY"
)

type Status string

const (
	StatusPending   Status = "PENDING"
	StatusRunning   Status = "RUNNING"
	StatusSucceeded Status = "SUCCEEDED"
	StatusFailed    Status = "FAILED"
)

// IdempotencyKey is incidentID+actionType, matching the SQS job's own dedupe
// key so a redelivered message and a retried row mean the same job. attempt
// is appended only when the same action legitimately needs to rerun, e.g.
// retrying a previously FAILED action.
func IdempotencyKey(incidentID string, actionType Type, attempt int) string {
	if attempt <= 1 {
		return fmt.Sprintf("%s:%s", incidentID, actionType)
	}
	return fmt.Sprintf("%s:%s:attempt-%d", incidentID, actionType, attempt)
}
