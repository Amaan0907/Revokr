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
