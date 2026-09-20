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

## Phase 3 — API and worker on ECS, dashboard gate on real data

Date: 2026-09-20, branch `c/phase3-dashboard-real-data`. Account IDs, endpoints and the live API
address are left out on purpose: this repo is public and the API has no authentication yet.

- **API:** ECS Express Mode service `revokr-api` (cluster `default`, `ap-south-2`), image
  `revokr-api:phase3` built from `cmd/api/Dockerfile`, public HTTPS endpoint `<API_URL>`. Task role
  `revokr-api-task-role`, execution role `ecsTaskExecutionRole`.
  - Plain env: `PORT`, `AWS_REGION`, `DB_HOST`, `DB_PORT`, `DB_NAME` (`postgres`), `DB_USER`
    (`revokr_admin`), `DB_SSLMODE`, `SQS_QUEUE_URL`, `GITHUB_APP_PRIVATE_KEY_SECRET_ARN`,
    `GITHUB_WEBHOOK_SECRET_ARN`.
  - `DB_PASSWORD` is injected from the RDS-managed secret's `password` key
    (`valueFrom: <secret-arn>:password::`), never written in the task definition.
- **Worker:** plain ECS service `revokr-worker` (Fargate, task definition family `revokr-worker`,
  image `revokr-api:worker-phase3` built from `cmd/worker/Dockerfile`, log group `/ecs/revokr-worker`).
  It is not an Express Mode service because Express services need an HTTP health check and the worker
  only polls SQS. It reuses the API service's security group.
- **What had to change before either would start:**
  1. `revokr-rds-sg` allowed 5432 only from one developer IP; added an inbound 5432 rule from the
     Express service's security group.
  2. `revokr-api-task-role` trusted only the account root, so ECS could not assume it; added
     `ecs-tasks.amazonaws.com` to its trust policy.
  3. Its `RevokrGitHubSecretsAccess` policy named the two GitHub secrets without Secrets Manager's
     random suffix, so IAM never matched (`AccessDenied` at startup); replaced with the full ARNs.
  4. `ecsTaskExecutionRole` had no Secrets Manager access, so `DB_PASSWORD` could not be injected;
     added inline policy `RevokrInjectSecrets` (`secretsmanager:GetSecretValue` on the RDS secret).
  5. `cmd/api/Dockerfile` used `golang:1.25` but `go.mod` requires Go 1.26.0 and the official image
     sets `GOTOOLCHAIN=local`; moved to `golang:1.26-alpine`. Added a root `.dockerignore` (the
     Dockerfile builds from the repo root, where `cmd/api/.dockerignore` is not read).
- **Dashboard (Amplify, `us-east-1`, branch `c/phase3-dashboard-real-data`):** env vars
  `REVOKR_API_URL`, `SITE_URL`, `SESSION_SECRET` and the GitHub/Google client id and secret.
  `amplify.yml` writes them to `.env.production` because Amplify does not otherwise expose console
  variables to the server runtime. `SITE_URL` pins the public address: behind Amplify the request's
  own origin reads as `https://localhost:3000`, which broke the OAuth redirect URI, post-login
  redirects and the same-origin check. Callback URLs for the Amplify domain are registered with the
  GitHub App and the Google OAuth client.
- **Gate result (2026-09-20):** a signed synthetic `push` webhook (simulated, fake AWS key id) sent to
  the deployed `/webhooks/github` → the ECS worker stored incident `dd9f61d1` in `AWAITING_APPROVAL`
  → it appeared on the Amplify dashboard from a phone → approved from the dashboard as the signed-in
  user → `RESOLVED` 30 seconds later. The API recorded 8 `audit_logs` rows (`detected`,
  `risk_scored`, `validated`, `auth_requested`, `approved`, `gh_secret_updated`, `key_created`,
  `old_key_disabled`) and 4 actions (`VALIDATE_CREDENTIAL`, `ROTATE_CREDENTIAL`,
  `UPDATE_GITHUB_SECRET`, `DISABLE_OLD_CREDENTIAL`), all `SUCCEEDED`.

**Known follow-ups (not done):**
- The Go API has no authentication and its address is public, so anyone who can reach it can call
  `POST /api/incidents/:id/approve`. Needs a shared-secret header or equivalent before this is more
  than a demo.
- A real `git push` does not create an incident: the worker only scans a `diff_content` field, which
  GitHub's push payload does not contain, and nothing fetches the commit diff. `simulated` also comes
  only from the webhook body. Test incidents come from a signed synthetic payload.
- `GET /api/incidents` returns `resource_ref`, the full AWS access key id, on each row. The dashboard
  drops it, but the API does not.
- `SITE_URL` is set at Amplify app level; `main` needs its own branch-level value before this merges.
- The task role has no IAM permissions for real (non-simulated) remediation, and `GITHUB_TOKEN` /
  `OPENAI_API_KEY` are not wired into the ECS tasks yet, so the analyst uses its template fallback.
- The RDS instance has no initial database (`DBName` unset, app uses `postgres`) and the master user is
  `revokr_admin`, not `revokradmin` as the RDS section above says.
- The developer AWS CLI profile was authenticating as the account root user; switch to an IAM user or
  SSO and delete the root access keys.
