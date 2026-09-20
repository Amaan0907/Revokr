# Revokr

**Automated secret incident response, built on AWS.** Revokr watches GitHub pushes for leaked
credentials, scores the risk, and — after a human approves — rotates the credential in the
right order: create the replacement, update where it is used, then disable the old one, with an
audit trail for every step.

Built for **First Commit — Bharat Builds Tour (WeMakeDevs × AWS)**, *Ship It* track.

**Live dashboard:** <https://main.d182hi6uhinkfi.amplifyapp.com/>

<!-- TODO: add the demo video link here -->

This describes the design. What runs today, and what doesn't, is in [Honest status](#honest-status).

## The problem

Students and small teams leak cloud keys into public repos all the time. Existing tooling tells
you it happened. It does not finish the job: rotating a key safely means creating a new one,
getting it to wherever the old one was used, and only then killing the old one. Doing that by
hand is slow and easy to get wrong, and a leaked AWS key can be abused within minutes.

Revokr's bet is that **detection is the easy half; ordered, verified, audited response is the
product.**

## How it works

```
git push ──▶ GitHub webhook (HMAC verified) ──▶ SQS ──▶ worker
                                                          │  scan diff for secrets
                                                          │  score risk (deterministic)
                                                          ▼
                                       incident: AWAITING_APPROVAL  ◀── dashboard
                                                          │  human clicks Approve
                                                          ▼
              create new key ─▶ validate it ─▶ update GitHub Actions secret
                                                          │
                                                          ▼
                          disable old key ─▶ confirm it is inactive ─▶ RESOLVED
```

Ordering rule, enforced in code: **never disable before the replacement exists and is
validated.** If updating the GitHub secret fails, the freshly created replacement is disabled
so no orphaned live key is left behind, and the incident is marked `FAILED`.

An AI analyst writes a plain-language explanation of each incident. It only ever receives
sanitized metadata (never the secret), and it has no way to trigger or influence a remediation
action. See [ARCHITECTURE.md](ARCHITECTURE.md) for how that is enforced.

## Where AWS fits

| Service | Role in Revokr |
|---|---|
| **Amplify Hosting** | Serves the Next.js dashboard |
| **ECS (Fargate)** | Runs the Go API (ECS Express Mode) and the Go worker |
| **RDS PostgreSQL** | Incidents, actions, audit log |
| **SQS + DLQ** | Push-event job queue between the API and the worker |
| **Secrets Manager** | GitHub App private key, webhook secret, database password, optional Slack webhook |
| **IAM** | The remediation target: a sandbox user's access keys, with a permissions-boundary role defined for managing them (see the status table for how far that is wired) |
| **CloudWatch Logs** | Container logs (the worker logs to `/ecs/revokr-worker`) |

Details, and the reasoning behind each choice, are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Honest status

This section says what works today and what does not. Nothing here is rounded up.

| Area | State |
|---|---|
| Webhook receive + HMAC signature check + SQS enqueue | Works |
| Secret detection | **Custom regex scanner** for 5 patterns: AWS access key ID, GitHub token, OpenAI key, Stripe live key, Slack bot token. It is not Gitleaks. |
| **Scanning a real `git push`** | **Written, not yet run live.** GitHub's push payload has no diff, so the worker fetches the head commit's added lines from the GitHub API and scans those (unit-tested against a fake server). Only the head commit of a push is scanned, and private repositories need `GITHUB_TOKEN` to be a token that can read them. The verified end-to-end run so far used a signed synthetic webhook (see below). |
| Risk engine | Works. Deterministic score 0–100 with the contributing factors shown in the UI. Some inputs are fixed placeholders for now (see ARCHITECTURE.md). |
| Incident state machine + audit log | Works. Invalid transitions are rejected; every transition writes an audit row. |
| Approval gate | Works. Rotation only starts from an explicit approve action. |
| **Simulation mode** | Works end to end on the deployed stack. A simulated incident uses a separate adapter that has no AWS or network code in it. **Simulation is chosen per incident** by the `simulated` flag in the webhook body. The Settings toggle in the dashboard only changes the banner and labels; it does not switch the backend between real and simulated. |
| **Real AWS IAM rotation** | Code is written (create → validate → deactivate → confirm inactive). **It has not been run through the deployed pipeline**: as of the last infra notes the ECS task role lacks the IAM permissions for it. The code uses whichever role the task runs as and does not itself assume the permissions-boundary role, so the boundary only limits it if the task runs as that role. |
| **Repository lookup and install** | An incident attaches to the `repositories` row whose owner and name match the pushed repo. If there is none, no incident is stored (the finding is only logged, masked). Installing the GitHub App registers the installer, the installation and its repositories from the `installation` and `installation_repositories` webhook events, so the App's webhook must be active and point at the API. Parsing is unit-tested; the database write has **not** been run against a real database or a real install yet. |
| GitHub Actions secret update | Implemented with libsodium sealed-box encryption. Uses a personal access token, not a GitHub App installation token. There is no read-back verification yet. |
| AI analyst | Uses **OpenAI (`gpt-4o-mini`)** on sanitized metadata, with a deterministic template fallback. Each analysis reports its `source`. **It does not use Amazon Bedrock** (the Go package is still named `bedrock` from the original plan). |
| Slack notifications | Optional, one channel, never contains the secret. |
| Dashboard | Incidents, incident detail, overview and audit pages read the real API when configured. **Repositories and Onboarding pages always show sample data.** The demo sign-in is open to anyone and, unless `ADMIN_LOGINS` is set, can read incident data once the dashboard is connected to the API (it can only approve simulated incidents). Setting `ADMIN_LOGINS` limits real data to the listed accounts and shows everyone else sample data. |
| Providers with automatic remediation | **AWS only.** Outside simulation, other detected providers stop at `NOT_SUPPORTED`. |

## Try it

### 1. The dashboard, no backend needed

```bash
cd web/revokr
npm ci
npm run dev        # http://localhost:3000
```

With `REVOKR_API_URL` unset the dashboard runs on built-in sample data. Choose the demo sign-in
on the login page. The demo session can only act on simulated incidents.

### 2. The full pipeline in simulation mode

The API loads the GitHub App secrets from AWS Secrets Manager at startup, and the worker polls
an SQS queue, so running both needs AWS credentials, a queue, and the values from
[.env.example](.env.example). Apply the SQL files in [migrations/](migrations) in order to a
PostgreSQL database first. They use the golang-migrate naming format. The repository you push as
must be registered in `repositories` (matching owner and name), or the worker does not store the
incident. Installing the GitHub App on it registers it, if the App's webhook points at your API;
otherwise insert a `users`, a `github_installations`
and a `repositories` row by hand.

```bash
# API (set PORT=8080 so it does not collide with the dashboard's port 3000)
go run ./cmd/api

# Worker, in another terminal
go run ./cmd/worker
```

Send a signed `push` event to `/webhooks/github` with `diff_content` and `simulated: true` in
the body. `simulated: true` makes every downstream step use the simulated adapter, so nothing
real is touched. An incident appears at `AWAITING_APPROVAL`. Approve it from the dashboard and
watch it reach `RESOLVED` with its timeline. Incidents are de-duplicated per repository by
secret fingerprint.

### Tests

```bash
go test ./...                              # detector, risk, state machine, sanitizer, notifications, queue
cd web/revokr && npx tsc --noEmit          # dashboard type-check
```

## Repository layout

```
cmd/api            HTTP API (Gin): webhook, incident endpoints
cmd/worker         SQS consumer: scan, score, create incident, validate
cmd/rotate-iam-key, cmd/update-gh-secret   manual helpers for exercising the real IAM / GitHub calls
internal/detector  secret patterns, masking, fingerprinting
internal/risk      deterministic risk scoring
internal/incidents state machine, validation, rotation, verification, audit log, HTTP handlers
internal/provider  adapter interface
internal/aws       real AWS adapter; internal/providers/{aws,github,simulated}: IAM client, GitHub Actions client, simulated adapter
internal/actions   remediation step rows (one per step, idempotency key)
internal/bedrock   AI analyst: sanitizer, OpenAI analyzer, template fallback
internal/githubapp webhook + install callback
internal/queue, secrets, notifications, apiauth, db
migrations/        PostgreSQL schema
infra/             Terraform for the sandbox IAM role, plus deployment notes
web/revokr         Next.js dashboard (Amplify)
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — design, data flow, security model, known limitations
- [infra/notes.md](infra/notes.md) — what was actually deployed and what broke on the way
- [LEARNINGS.md](LEARNINGS.md) — what we learned building it
- [CREDITS.md](CREDITS.md) — third-party software and licences

## Team

Amaan, Sameer Khan, omarbshah and eimun (per the git history).
