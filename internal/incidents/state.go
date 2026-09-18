package incidents

type Status string

const (
	StatusDetected           Status = "DETECTED"
	StatusValidating         Status = "VALIDATING"
	StatusAwaitingApproval   Status = "AWAITING_APPROVAL"
	StatusRotating           Status = "ROTATING"
	StatusVerifying          Status = "VERIFYING"
	StatusResolved           Status = "RESOLVED"
	StatusFailed             Status = "FAILED"
	StatusRequiresUserAction Status = "REQUIRES_USER_ACTION"
	StatusNotSupported       Status = "NOT_SUPPORTED"
)

// validTransitions lists the statuses each status is allowed to move to.
// Mirrors the CHECK constraint on incidents.status in migrations/000004.
var validTransitions = map[Status][]Status{
	StatusDetected:         {StatusValidating, StatusNotSupported},
	StatusValidating:       {StatusAwaitingApproval, StatusFailed, StatusNotSupported},
	StatusAwaitingApproval: {StatusRotating, StatusRequiresUserAction, StatusFailed},
	StatusRotating:         {StatusVerifying, StatusFailed},
	StatusVerifying:        {StatusResolved, StatusFailed},
}

func (s Status) CanTransitionTo(next Status) bool {
	for _, allowed := range validTransitions[s] {
		if allowed == next {
			return true
		}
	}
	return false
}
