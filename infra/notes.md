# Infra Notes

## Phase 0 — Sandbox IAM role for remediation target

- **Sandbox AWS account ID:** `<SANDBOX_ACCOUNT_ID>`
- **Target IAM user (demo/test):** `test-user`
  - ARN: `arn:aws:iam::<SANDBOX_ACCOUNT_ID>:user/test-user`
  - Has one test access key created for the remediation demo; secret value is not
    recorded anywhere, including here.
- **Identity policy:** `RemediationTestUserPolicy`
  - ARN: `arn:aws:iam::<SANDBOX_ACCOUNT_ID>:policy/RemediationTestUserPolicy`
  - Grants `iam:ListAccessKeys`, `iam:GetAccessKeyLastUsed`, `iam:UpdateAccessKey`,
    `iam:DeleteAccessKey`, scoped to `arn:aws:iam::<SANDBOX_ACCOUNT_ID>:user/test-user`
- **Permissions boundary:** `RemediationPermissionsBoundary`
  - ARN: `arn:aws:iam::<SANDBOX_ACCOUNT_ID>:policy/RemediationPermissionsBoundary`
  - Caps the role to the same access-key operations on `test-user`, regardless of
    what the identity policy is later changed to.
- **Role:** `RemediationSandboxRole`
  - ARN: `arn:aws:iam::<SANDBOX_ACCOUNT_ID>:role/RemediationSandboxRole`
  - Trust policy: `ecs-tasks.amazonaws.com` (same-account model — the ECS task
    assumes this role directly, no cross-account STS)
  - Attached policy: `RemediationTestUserPolicy`
  - Permissions boundary: `RemediationPermissionsBoundary`
- **ECS task definition:** execution role `ecsTaskExecutionRole`, task role
  `RemediationSandboxRole`

**Known follow-up (not yet done):** the identity and boundary policies currently
scope the resource ARN as `arn:aws:iam::*:user/test-user` (account ID wildcarded).
Needs tightening to the real sandbox account ID above before this is considered
fully locked down.

## Phase 0 — RDS PostgreSQL instance

- **Instance identifier:** `revokr-db`
- **Engine:** PostgreSQL 16.x
- **Instance class:** `db.t4g.micro` (or `db.t3.micro`)
- **Storage:** 20 GiB gp3, autoscaling disabled
- **Multi-AZ:** No
- **Endpoint:** `<RDS_ENDPOINT>`
- **Port:** 5432
- **Initial database:** `revokr`
- **Master username:** `revokradmin`
- **Credentials:** managed by RDS in AWS Secrets Manager (not a plaintext password
  anywhere) — secret ARN: `<RDS_SECRET_ARN>`
- **VPC / networking:** same VPC as the ECS cluster; security group `revokr-rds-sg`
  allows inbound 5432 only from the ECS task's security group (plus a temporary
  rule for local dev access, removed after initial setup)
- **Deletion protection:** off (event teardown)
- **Auto minor version upgrade:** off (avoid a forced restart mid-event)

**Verified:** connected via `psql` using the Secrets Manager credentials, `sslmode=require`.

**Known follow-up:** app currently reads DB connection details from `.env`
(`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) — plan is to switch the
password lookup to Secrets Manager at runtime once checkpoint 9 lands, rather than
keeping it in `.env` long-term.

## Phase 0 — SQS job queue and DLQ

- **Dead-letter queue:** `revokr-jobs-dlq`
  - URL: `<DLQ_QUEUE_URL>`
  - ARN: `<DLQ_QUEUE_ARN>`
  - Message retention: 14 days
  - Redrive allow policy: restricted to `revokr-jobs` only

- **Main queue:** `revokr-jobs`
  - URL: `<MAIN_QUEUE_URL>`
  - ARN: `<MAIN_QUEUE_ARN>`
  - Visibility timeout: 120s
  - Redrive policy: max receives = 5 → `revokr-jobs-dlq`

- **IAM:** permissions for both queues live on `revokr-api-task-role` (the general
  app task role), not `RemediationSandboxRole` — same separation as the RDS secret
  access, so the narrowly-scoped remediation role never gains unrelated permissions.
  - `sqs:SendMessage`, `sqs:GetQueueAttributes` on `revokr-jobs`
  - `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`,
    `sqs:GetQueueAttributes` on `revokr-jobs`

**Verified:** sent a test message via console, confirmed delivery; confirmed a
message received 5x without deletion lands in `revokr-jobs-dlq`.
