# What we learned

Written from what actually happened during the build: the deployment notes in
[infra/notes.md](infra/notes.md) and the commit history.

## Getting a container running on AWS is mostly IAM and networking

The original plan put both services on App Runner. AWS pulled it during the event, so we moved
to ECS Fargate mid-build, with the API on Express Mode and the worker as a plain Fargate service
(Express Mode wants an HTTP health check; a queue poller has none). The move worked, but the
services would not start until five separate things were fixed. Each was small and none was in
the code:

1. The RDS security group only allowed one developer IP, so the ECS service could not reach the
   database.
2. The task role's trust policy only trusted the account root, so ECS could not assume it. It
   needed `ecs-tasks.amazonaws.com`.
3. Our policy named the two Secrets Manager secrets without the random suffix AWS appends to
   their ARNs, so IAM never matched and startup failed with `AccessDenied`.
4. The task **execution** role (which injects secrets into the container) had no Secrets Manager
   permission, so the database password could not be injected. This is a different role from the
   task role, and it is easy to grant one and forget the other.
5. The Dockerfile used `golang:1.25` while `go.mod` required Go 1.26. The official image sets
   `GOTOOLCHAIN=local`, so it refuses to download the newer toolchain and the build fails.

The lesson we took: when a deploy fails, list every identity involved (execution role, task role,
security groups, secret ARNs) and check each one, instead of assuming the code is at fault.

## Amplify does not give server code your environment variables

Variables set in the Amplify console are visible at build time, not to the running Next.js
server. Sign-in silently turned itself off and the dashboard fell back to sample data. We now
write the variables into `.env.production` during the build ([amplify.yml](amplify.yml)).

A related surprise: behind Amplify the request's own origin reads as `https://localhost:3000`,
which broke OAuth redirect URIs, post-login redirects and the same-origin check. Pinning the
public address in a `SITE_URL` setting fixed all three.

## Never paste a generated password into a connection string

RDS-generated passwords can contain `@`, `:`, `/`, `?`, `#` or `%`, all of which are special in a
`postgres://` URL. Our first version built the URL with `fmt.Sprintf`, which fails to connect
with such a password. It now builds it with Go's `net/url`, which escapes each part
([internal/db/db.go](internal/db/db.go)).

## Keep the model out of the decision path, and make that structural

The most useful design choice was making "the AI cannot act" true by construction rather than by
prompt. The analyst receives a type with no field meant to hold a secret, and it has no reference
to any adapter or to the `actions` table. Because the risk score is a plain sum of named factors,
we could also show *why* an incident scored what it did.

One thing we found when auditing the repo before submitting: we had a `SanitizeIncident` function with a
unit test proving it drops a raw secret, but the HTTP handler that actually calls the analyst
builds the sanitized struct itself and never calls that function. The test was green and correct,
and it was testing code that isn't on the production path. When you write a guard, make the
production code call it.

## Order and failure handling are the product

Rotating in the order create → validate → update destination → disable old is easy to state and
easy to break on the failure path. The case that needed real thought: if the replacement key is
created but the GitHub secret update fails, nobody holds the new key's secret. Leaving it active
would strand a live credential, so that path now disables the replacement and leaves the old key
alone, and the incident records what was and wasn't cleaned up. We did not give the same care to
the earlier failure, where the replacement key is created but fails validation: nothing disables
it, and since an IAM user can hold only two access keys, that leftover blocks a retry. Every
step that creates something needs its own clean-up path, not just the last one.

A related trap: we can only see the *ID* of a leaked AWS key, never its secret half, so we cannot
prove the key is live or dead by authenticating as it. Validation and the "old key is dead" check
therefore ask IAM for the key's status instead, while the *new* key is proven by actually using it.

## Simulation should be a separate code path, not a flag

Because a demo cannot depend on a live third-party API behaving, we built simulation as its own
adapter that imports no AWS or HTTP code. That makes "simulation can never touch a real
credential" something the compiler helps guarantee, not something a config value promises.

We then undercut it in the UI: the dashboard's Simulation switch is only a cookie for labels and a
banner, while the backend decides per incident from a flag on the webhook. A control that looks
like it governs behaviour but doesn't is worse than no control. It should have been wired to the
same source of truth, or removed.

## A passing gate can hide a gap

Our Phase 3 end-to-end check passed on the deployed stack: webhook, incident, approval,
`RESOLVED`, eight audit rows. But it ran on a hand-signed payload that contains a `diff_content`
field GitHub never sends, so a real `git push` still produces no incident. The check was true and
still didn't prove the thing we cared about. Next time the gate should be triggered the way a real
user would trigger it.

We also kept a package called `bedrock` after its implementation became OpenAI. The name outlived
the decision and misdescribed the code until we wrote it down here. Rename things when the plan
changes.

## Working as four people

We split by phase and by branch prefix (`a/`, `b/`, `c/`, `amaan/`) and merged through pull
requests, 14 of them. Keeping the phases as separate, mergeable slices (detection, risk and state
machine, IAM rotation, GitHub secrets, dashboard, notifications) let people work in parallel
without stepping on each other. The cost was integration: several bugs only showed up when the
slices met on the deployed stack.
