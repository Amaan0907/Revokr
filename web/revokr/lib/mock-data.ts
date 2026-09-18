import type {
  ActionStatus,
  ActionType,
  AuditAction,
  AuditLogEntry,
  AuditResult,
  Incident,
  IncidentDetail,
  RemediationAction,
} from "./types";

// Timestamps are relative to page load so the demo always looks recent.
const NOW = Date.now();
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const REPOS = {
  payments: {
    repositoryId: "0d6e2f9a-1c47-4b83-a9e5-7c2b8d4f1a30",
    repositoryOwner: "acme",
    repositoryName: "payments-api",
  },
  web: {
    repositoryId: "8b1f4c7e-3a92-4d6b-b0e8-5f2a9c7d3e14",
    repositoryOwner: "acme",
    repositoryName: "web-dashboard",
  },
  ml: {
    repositoryId: "f3a8d1c6-7e24-4b9f-8a53-1d6c0e9b2f47",
    repositoryOwner: "acme",
    repositoryName: "ml-pipeline",
  },
  opsBot: {
    repositoryId: "57e9b2d4-a3c1-4f68-9e07-b4d2a8c1f3e5",
    repositoryOwner: "acme",
    repositoryName: "ops-bot",
  },
  infra: {
    repositoryId: "c9d4a7e1-2f58-4a3c-b6e9-0a7f3d2c8b16",
    repositoryOwner: "acme",
    repositoryName: "infra-terraform",
  },
  docs: {
    repositoryId: "1e8c3b6f-9d04-4e72-a1b5-f6c9e2d7a083",
    repositoryOwner: "acme",
    repositoryName: "docs-site",
  },
} as const;

const PLAN: ActionType[] = [
  "VALIDATE_CREDENTIAL",
  "ROTATE_CREDENTIAL",
  "UPDATE_GITHUB_SECRET",
  "DISABLE_OLD_CREDENTIAL",
  "SEND_NOTIFICATION",
];

function action(
  incidentId: string,
  index: number,
  actionType: ActionType,
  status: ActionStatus,
  startedMinutesAgo: number,
  error?: string,
): RemediationAction {
  const started = status !== "PENDING";
  const finished = status === "SUCCEEDED" || status === "FAILED";
  return {
    id: `${incidentId}-action-${index + 1}`,
    incidentId,
    actionType,
    status,
    error: status === "FAILED" ? (error ?? null) : null,
    startedAt: started ? ago(startedMinutesAgo) : null,
    completedAt: finished ? ago(startedMinutesAgo - 0.2) : null,
  };
}

// Validation runs before the approval gate; every later step runs after it.
function remediation(
  incidentId: string,
  validatedMinutesAgo: number,
  approvedMinutesAgo: number | null,
  statuses: ActionStatus[],
  error?: string,
): RemediationAction[] {
  return statuses.map((status, i) => {
    const start =
      i === 0 ? validatedMinutesAgo : (approvedMinutesAgo ?? 0) - 0.1 - (i - 1) * 0.4;
    return action(incidentId, i, PLAN[i], status, start, error);
  });
}

type LogSpec = [
  minutesAgo: number,
  actor: string,
  action: AuditAction,
  result: AuditResult,
  metadata?: Record<string, unknown>,
];

function timeline(incidentId: string, specs: LogSpec[]): AuditLogEntry[] {
  return specs.map(([minutesAgo, actor, auditAction, result, metadata], i) => ({
    id: `${incidentId}-log-${i + 1}`,
    incidentId,
    actor,
    action: auditAction,
    result,
    metadata: metadata ?? null,
    timestamp: ago(minutesAgo),
  }));
}

const OPERATOR = "sameer-khan-1";

const I1 = "3f9a6c21-8e4b-4d7a-b1c5-2a9e7f0d1c34";
const I2 = "b82e4d17-0c6f-4a93-8e25-7f1d3c9a6b58";
const I3 = "5d1c8a3e-9f27-4b60-a4e8-c3b2f7d10e96";
const I4 = "e4a7b920-3d15-4c8e-9f61-0b7a2d5e8c13";
const I5 = "91c6f3d8-7a2e-4b05-8d49-e6f0a1b2c7d4";
const I6 = "2b7e9a14-c6d3-4f8b-a052-9d1e3c7f6a28";
const I7 = "c05d2e8b-4a91-4e7c-b3f6-8a2d9e1c0f57";
const I8 = "6a3f1b9d-e2c7-4d58-9a14-f7b0c3e6d2a9";
const I9 = "d8e2c4a6-1b3f-4a79-8c05-3e9d7b1f4a60";
const I10 = "4c9b7e2a-f81d-4c36-a5e0-6d2b9f3a7e11";
const I11 = "a6d0f8c3-5e29-4b1a-9c74-2f8e1d6b3a95";

const LIVE = { factor: "Credential is live", points: 35 };
const PUBLIC_REPO = { factor: "Public repository", points: 20 };

const details: IncidentDetail[] = [
  {
    incident: {
      id: I1,
      ...REPOS.payments,
      commitSha: "4e1a9c7f2b3d8e6051a2c9f7b4d3e8a1c6f0b2d9",
      filePath: "config/.env.production",
      lineNumber: 4,
      provider: "aws",
      secretType: "AWS access key",
      fingerprint: "9f2c4e1a7b3d8065",
      maskedValue: "AKIA••••••••••••7QXM",
      isLive: true,
      severity: "CRITICAL",
      riskScore: 96,
      riskFactors: [
        { ...LIVE, detail: "Validated with sts:GetCallerIdentity" },
        PUBLIC_REPO,
        { factor: "Production config file", points: 25, detail: "config/.env.production" },
        { factor: "Broad IAM permissions", points: 10, detail: "Attached policy allows s3:* and ec2:*" },
        { factor: "Pushed to default branch", points: 6 },
      ],
      status: "AWAITING_APPROVAL",
      simulated: true,
      createdAt: ago(12),
      resolvedAt: null,
    },
    actions: remediation(I1, 11.8, null, ["SUCCEEDED", "PENDING", "PENDING", "PENDING", "PENDING"]),
    auditLog: timeline(I1, [
      [12, "detector", "detected", "success", { path: "config/.env.production", line: 4 }],
      [11.8, "validator", "validated", "success", { isLive: true }],
      [11.7, "risk-engine", "risk_scored", "success", { score: 96, severity: "CRITICAL" }],
      [11.6, "approval-gate", "auth_requested", "pending"],
    ]),
    analysis: {
      summary:
        "A live AWS access key for the payments service was pushed to a public repository inside a production environment file.",
      whyItMatters:
        "Automated scanners harvest AWS keys from public GitHub pushes within minutes. This key's IAM user can reach production billing resources, so an attacker could read customer payment data or run up compute costs.",
      recommendedResponse:
        "Approve rotation now. Revokr will create a replacement key, update the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY Actions secrets, and disable the leaked key only after the new one is verified.",
      confidence: 0.93,
      source: "bedrock",
    },
  },
  {
    incident: {
      id: I2,
      ...REPOS.web,
      commitSha: "a7c2e9f41b8d3065c7e2a9f14b3d8c6e0a5f2b71",
      filePath: "scripts/deploy.sh",
      lineNumber: 17,
      provider: "github",
      secretType: "GitHub personal access token",
      fingerprint: "3b8e1d6c9a4f2075",
      maskedValue: "ghp_••••••••••••••••k2Zq",
      isLive: true,
      severity: "HIGH",
      riskScore: 81,
      riskFactors: [
        { ...LIVE, detail: "Validated with the GitHub API" },
        PUBLIC_REPO,
        { factor: "Write access to repositories", points: 15, detail: "Token scopes: repo, workflow" },
        { factor: "Used by CI", points: 11, detail: "Referenced in scripts/deploy.sh" },
      ],
      status: "ROTATING",
      simulated: true,
      createdAt: ago(9),
      resolvedAt: null,
    },
    actions: remediation(I2, 8.8, 1.5, ["SUCCEEDED", "RUNNING", "PENDING", "PENDING", "PENDING"]),
    auditLog: timeline(I2, [
      [9, "detector", "detected", "success", { path: "scripts/deploy.sh", line: 17 }],
      [8.8, "validator", "validated", "success", { isLive: true }],
      [8.7, "risk-engine", "risk_scored", "success", { score: 81, severity: "HIGH" }],
      [8.6, "approval-gate", "auth_requested", "pending"],
      [1.5, OPERATOR, "approved", "success"],
    ]),
    analysis: {
      summary:
        "A GitHub personal access token with repository write access was found in a deploy script.",
      whyItMatters:
        "Anyone holding this token can push code to your repositories, including CI workflows that run with your other secrets.",
      recommendedResponse:
        "Rotation is in progress. Once the new token is issued, Revokr updates the DEPLOY_TOKEN secret and revokes the old token.",
      confidence: 0.8,
      source: "template",
    },
  },
  {
    incident: {
      id: I3,
      ...REPOS.ml,
      commitSha: "1f8b3e6c9a2d7f04e5b1c8a3d6f9e2b7c0a4d813",
      filePath: "notebooks/eval.ipynb",
      lineNumber: 212,
      provider: "openai",
      secretType: "OpenAI API key",
      fingerprint: "c71a9e3f5b2d8406",
      maskedValue: "sk-proj-••••••••••••Tx9A",
      isLive: true,
      severity: "HIGH",
      riskScore: 74,
      riskFactors: [
        { ...LIVE, detail: "Validated with the OpenAI API" },
        PUBLIC_REPO,
        { factor: "Billable API access", points: 12 },
        { factor: "Exposed in notebook output", points: 7, detail: "Saved cell output in notebooks/eval.ipynb" },
      ],
      status: "VERIFYING",
      simulated: true,
      createdAt: ago(26),
      resolvedAt: null,
    },
    actions: remediation(I3, 25.8, 3, ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "PENDING"]),
    auditLog: timeline(I3, [
      [26, "detector", "detected", "success", { path: "notebooks/eval.ipynb", line: 212 }],
      [25.8, "validator", "validated", "success", { isLive: true }],
      [25.7, "risk-engine", "risk_scored", "success", { score: 74, severity: "HIGH" }],
      [25.6, "approval-gate", "auth_requested", "pending"],
      [3, OPERATOR, "approved", "success"],
      [2.7, "openai-adapter", "key_created", "success", { newKey: "sk-proj-••••••••••••Lm4c" }],
      [2.3, "github-adapter", "gh_secret_updated", "success", { secret: "OPENAI_API_KEY", repository: "acme/ml-pipeline" }],
      [1.9, "openai-adapter", "old_key_disabled", "success"],
      [1.8, "verifier", "verified", "pending"],
    ]),
    analysis: {
      summary:
        "An OpenAI API key was left in a notebook's saved output and pushed to a public repository.",
      whyItMatters:
        "Leaked OpenAI keys are commonly used to resell API access, which can exhaust your usage limits and generate large bills within hours.",
      recommendedResponse:
        "The replacement key is live and the old key is disabled. Revokr is confirming the old key is rejected before closing the incident.",
      confidence: 0.88,
      source: "bedrock",
    },
  },
  {
    incident: {
      id: I4,
      ...REPOS.payments,
      commitSha: "c3e7a1f9d2b8406e5c1a7f3b9d2e8c4a6f0b1d52",
      filePath: "src/billing/stripe-client.ts",
      lineNumber: 9,
      provider: "stripe",
      secretType: "Stripe live secret key",
      fingerprint: "e20b7d4a1c9f3658",
      maskedValue: "sk_live_••••••••••••4hQe",
      isLive: true,
      severity: "CRITICAL",
      riskScore: 92,
      riskFactors: [
        { ...LIVE, detail: "Validated with the Stripe API" },
        PUBLIC_REPO,
        { factor: "Live-mode payment key", points: 30, detail: "sk_live prefix" },
        { factor: "Customer data in scope", points: 7 },
      ],
      status: "RESOLVED",
      simulated: true,
      createdAt: ago(300),
      resolvedAt: ago(290.5),
    },
    actions: remediation(I4, 299.8, 292, ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED"]),
    auditLog: timeline(I4, [
      [300, "detector", "detected", "success", { path: "src/billing/stripe-client.ts", line: 9 }],
      [299.8, "validator", "validated", "success", { isLive: true }],
      [299.7, "risk-engine", "risk_scored", "success", { score: 92, severity: "CRITICAL" }],
      [299.6, "approval-gate", "auth_requested", "pending"],
      [292, OPERATOR, "approved", "success"],
      [291.7, "stripe-adapter", "key_created", "success", { newKey: "sk_live_••••••••••••9vRn" }],
      [291.3, "github-adapter", "gh_secret_updated", "success", { secret: "STRIPE_SECRET_KEY", repository: "acme/payments-api" }],
      [290.9, "stripe-adapter", "old_key_disabled", "success"],
      [290.8, "verifier", "verified", "success"],
      [290.5, "revokr", "resolved", "success"],
    ]),
    analysis: {
      summary:
        "A Stripe live secret key in the billing client was rotated, and the leaked key is confirmed dead.",
      whyItMatters:
        "A live Stripe secret key can issue refunds, read customer data and create charges. It was exposed for under 10 minutes.",
      recommendedResponse:
        "No further action needed. Consider removing the key from git history so it no longer appears in old commits.",
      confidence: 0.95,
      source: "bedrock",
    },
  },
  {
    incident: {
      id: I5,
      ...REPOS.opsBot,
      commitSha: "8d2f6b1e4c9a3075f8e2b6d1c4a9f3e7b0d5c268",
      filePath: "bot/config.yaml",
      lineNumber: 3,
      provider: "slack",
      secretType: "Slack incoming webhook",
      fingerprint: "5a3f8c1e7d2b9046",
      maskedValue: "hooks.slack.com/services/T04••••/B06••••/••••••••",
      isLive: true,
      severity: "MEDIUM",
      riskScore: 48,
      riskFactors: [
        { ...LIVE, detail: "Webhook accepted a test request" },
        { factor: "Can post to your workspace", points: 13 },
      ],
      status: "REQUIRES_USER_ACTION",
      simulated: true,
      createdAt: ago(190),
      resolvedAt: null,
    },
    actions: [
      action(I5, 0, "VALIDATE_CREDENTIAL", "SUCCEEDED", 189.8),
      action(I5, 1, "ROTATE_CREDENTIAL", "FAILED", 184.9, "Slack incoming webhooks can't be rotated through the API."),
      action(I5, 2, "SEND_NOTIFICATION", "SUCCEEDED", 184.5),
    ],
    auditLog: timeline(I5, [
      [190, "detector", "detected", "success", { path: "bot/config.yaml", line: 3 }],
      [189.8, "validator", "validated", "success", { isLive: true }],
      [189.7, "risk-engine", "risk_scored", "success", { score: 48, severity: "MEDIUM" }],
      [189.6, "approval-gate", "auth_requested", "pending"],
      [185, OPERATOR, "approved", "success"],
      [184.7, "slack-adapter", "failed", "pending", {
        reason: "Slack incoming webhooks can't be rotated through the API",
        nextStep: "Regenerate the webhook in Slack, then update SLACK_WEBHOOK_URL",
      }],
    ]),
    analysis: {
      summary: "A Slack incoming webhook URL was committed to the ops bot's config.",
      whyItMatters:
        "Anyone with the URL can post messages into your workspace, which makes convincing phishing messages easy.",
      recommendedResponse:
        "Slack webhooks can't be rotated through the API. Regenerate the webhook in Slack, update SLACK_WEBHOOK_URL, then mark this incident resolved.",
      confidence: 0.72,
      source: "template",
    },
  },
  {
    incident: {
      id: I6,
      ...REPOS.infra,
      commitSha: "e9a4c1f7b3d2860a5e9c4f1b7d3a2e8c6b0f4d17",
      filePath: "keys/sa-prod.json",
      lineNumber: 5,
      provider: "gcp",
      secretType: "GCP service account key",
      fingerprint: "b94d2e7a0c6f1835",
      maskedValue: "private_key_id: 7c1e••••••••••••a93f",
      isLive: true,
      severity: "HIGH",
      riskScore: 77,
      riskFactors: [
        { ...LIVE, detail: "Validated with the GCP IAM API" },
        PUBLIC_REPO,
        { factor: "Owner role on production project", points: 22 },
      ],
      status: "FAILED",
      simulated: true,
      createdAt: ago(540),
      resolvedAt: null,
    },
    actions: remediation(
      I6,
      539.8,
      530,
      ["SUCCEEDED", "FAILED", "PENDING", "PENDING", "SUCCEEDED"],
      "Permission denied: caller lacks iam.serviceAccountKeys.create on the target service account.",
    ),
    auditLog: timeline(I6, [
      [540, "detector", "detected", "success", { path: "keys/sa-prod.json", line: 5 }],
      [539.8, "validator", "validated", "success", { isLive: true }],
      [539.7, "risk-engine", "risk_scored", "success", { score: 77, severity: "HIGH" }],
      [539.6, "approval-gate", "auth_requested", "pending"],
      [530, OPERATOR, "approved", "success"],
      [529.7, "gcp-adapter", "failed", "failure", { step: "ROTATE_CREDENTIAL", oldKeyDisabled: false }],
    ]),
    analysis: {
      summary: "Rotation of a GCP service account key failed, so the leaked key is still active.",
      whyItMatters:
        "This service account has Owner on the production project. The leaked key still grants full control until it's replaced.",
      recommendedResponse:
        "Grant Revokr's remediation role iam.serviceAccountKeyAdmin on this account and retry, or rotate the key manually in the GCP console.",
      confidence: 0.76,
      source: "template",
    },
  },
  {
    incident: {
      id: I7,
      ...REPOS.web,
      commitSha: "5b3d9e2a7f1c4086b5d3e9a2f7c1b4d8e0a6f375",
      filePath: "src/lib/analytics.ts",
      lineNumber: 44,
      provider: "generic",
      secretType: "High-entropy string",
      fingerprint: "17c8f3a9e2d5b604",
      maskedValue: "••••••••••••••••Qm8=",
      isLive: null,
      severity: "LOW",
      riskScore: 18,
      riskFactors: [
        { factor: "High-entropy string", points: 18, detail: "Provider could not be identified" },
      ],
      status: "NOT_SUPPORTED",
      simulated: true,
      createdAt: ago(1500),
      resolvedAt: null,
    },
    actions: [],
    auditLog: timeline(I7, [
      [1500, "detector", "detected", "success", { path: "src/lib/analytics.ts", line: 44 }],
      [1499.8, "validator", "validated", "failure", { reason: "No validator exists for generic high-entropy strings" }],
      [1499.7, "risk-engine", "risk_scored", "success", { score: 18, severity: "LOW" }],
    ]),
    analysis: {
      summary: "A high-entropy string in the analytics module matched a generic secret pattern.",
      whyItMatters:
        "The provider couldn't be identified, so Revokr can't confirm whether it's a live credential.",
      recommendedResponse:
        "Review the value. If it's a real credential, rotate it with its provider; if not, mark it as a false positive.",
      confidence: 0.55,
      source: "template",
    },
  },
  {
    incident: {
      id: I8,
      ...REPOS.infra,
      commitSha: "2c7f4a9e1d6b3508c2f7a4e9d1b6c3f8a0e5b294",
      filePath: "test/fixtures/aws.env",
      lineNumber: 2,
      provider: "aws",
      secretType: "AWS access key",
      fingerprint: "d3e6a0b8f1c2974e",
      maskedValue: "AKIA••••••••••••X2PL",
      isLive: null,
      severity: "MEDIUM",
      riskScore: 52,
      riskFactors: [
        PUBLIC_REPO,
        { factor: "AWS key format", points: 22, detail: "Matches the AKIA access key pattern" },
        { factor: "Pushed to default branch", points: 10 },
      ],
      status: "VALIDATING",
      simulated: true,
      createdAt: ago(4),
      resolvedAt: null,
    },
    actions: [action(I8, 0, "VALIDATE_CREDENTIAL", "RUNNING", 3.9)],
    auditLog: timeline(I8, [
      [4, "detector", "detected", "success", { path: "test/fixtures/aws.env", line: 2 }],
      [3.9, "validator", "validated", "pending"],
    ]),
    analysis: {
      summary:
        "An AWS access key was found in a test fixtures file. Revokr is checking whether it's live.",
      whyItMatters:
        "Keys in test fixtures are often placeholders, but real keys copied into fixtures are a common source of leaks.",
      recommendedResponse:
        "Wait for validation to finish. If the key is live, you'll be asked to approve rotation.",
      confidence: 0.6,
      source: "template",
    },
  },
  {
    incident: {
      id: I9,
      ...REPOS.docs,
      commitSha: "f6e1b8d3a9c2470f6e1b8d3c9a2f4e7b0c5d8160",
      filePath: "README.md",
      lineNumber: 88,
      provider: "github",
      secretType: "GitHub personal access token",
      fingerprint: "8a1d5f2c7e3b0969",
      maskedValue: "ghp_••••••••••••••••n8Rv",
      isLive: null,
      severity: "LOW",
      riskScore: 22,
      riskFactors: [
        PUBLIC_REPO,
        { factor: "Found in documentation", points: 2, detail: "Often an example value" },
      ],
      status: "DETECTED",
      simulated: true,
      createdAt: ago(1),
      resolvedAt: null,
    },
    actions: [],
    auditLog: timeline(I9, [[1, "detector", "detected", "success", { path: "README.md", line: 88 }]]),
    analysis: null,
  },
  {
    incident: {
      id: I10,
      ...REPOS.ml,
      commitSha: "9a5e2c8f1b4d7063a9e5c2f8b1d4a7e3c6f0b538",
      filePath: "pipelines/train.py",
      lineNumber: 31,
      provider: "openai",
      secretType: "OpenAI API key",
      fingerprint: "f0c4b7e1a8d3526b",
      maskedValue: "sk-proj-••••••••••••Wd3K",
      isLive: true,
      severity: "MEDIUM",
      riskScore: 55,
      riskFactors: [
        { ...LIVE, detail: "Validated with the OpenAI API" },
        { factor: "Billable API access", points: 12 },
        { factor: "Pushed to default branch", points: 8 },
      ],
      status: "RESOLVED",
      simulated: true,
      createdAt: ago(2880),
      resolvedAt: ago(2868.5),
    },
    actions: remediation(I10, 2879.8, 2870, ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED"]),
    auditLog: timeline(I10, [
      [2880, "detector", "detected", "success", { path: "pipelines/train.py", line: 31 }],
      [2879.8, "validator", "validated", "success", { isLive: true }],
      [2879.7, "risk-engine", "risk_scored", "success", { score: 55, severity: "MEDIUM" }],
      [2879.6, "approval-gate", "auth_requested", "pending"],
      [2870, OPERATOR, "approved", "success"],
      [2869.7, "openai-adapter", "key_created", "success", { newKey: "sk-proj-••••••••••••Pb7y" }],
      [2869.3, "github-adapter", "gh_secret_updated", "success", { secret: "OPENAI_API_KEY", repository: "acme/ml-pipeline" }],
      [2868.9, "openai-adapter", "old_key_disabled", "success"],
      [2868.8, "verifier", "verified", "success"],
      [2868.5, "revokr", "resolved", "success"],
    ]),
    analysis: {
      summary:
        "An OpenAI API key committed to the ML pipeline was rotated and the old key disabled.",
      whyItMatters:
        "The key had access to the organization's paid models, so any misuse would have been billed to your account.",
      recommendedResponse: "No further action needed.",
      confidence: 0.84,
      source: "template",
    },
  },
  {
    incident: {
      id: I11,
      ...REPOS.infra,
      commitSha: "3d8c1a6e9f2b5704d3c8a1e6f9b2d5c7e0a4f691",
      filePath: "environments/prod/terraform.tfvars",
      lineNumber: 12,
      provider: "aws",
      secretType: "AWS access key",
      fingerprint: "6e9b3d0f4a7c1285",
      maskedValue: "AKIA••••••••••••H5TJ",
      isLive: true,
      severity: "CRITICAL",
      riskScore: 94,
      riskFactors: [
        { ...LIVE, detail: "Validated with sts:GetCallerIdentity" },
        PUBLIC_REPO,
        { factor: "Production config file", points: 25, detail: "environments/prod/terraform.tfvars" },
        { factor: "Admin-level IAM permissions", points: 14 },
      ],
      status: "RESOLVED",
      simulated: true,
      createdAt: ago(4320),
      resolvedAt: ago(4298.5),
    },
    actions: remediation(I11, 4319.8, 4300, ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED"]),
    auditLog: timeline(I11, [
      [4320, "detector", "detected", "success", { path: "environments/prod/terraform.tfvars", line: 12 }],
      [4319.8, "validator", "validated", "success", { isLive: true }],
      [4319.7, "risk-engine", "risk_scored", "success", { score: 94, severity: "CRITICAL" }],
      [4319.6, "approval-gate", "auth_requested", "pending"],
      [4300, OPERATOR, "approved", "success"],
      [4299.7, "aws-adapter", "key_created", "success", { newAccessKeyId: "AKIA••••••••••••9WQD" }],
      [4299.3, "github-adapter", "gh_secret_updated", "success", { secret: "AWS_ACCESS_KEY_ID", repository: "acme/infra-terraform" }],
      [4298.9, "aws-adapter", "old_key_disabled", "success"],
      [4298.8, "verifier", "verified", "success"],
      [4298.5, "revokr", "resolved", "success"],
    ]),
    analysis: {
      summary:
        "A live AWS key with broad IAM permissions was rotated after about 20 minutes of exposure.",
      whyItMatters:
        "The key's IAM user could create and delete resources across the production account.",
      recommendedResponse:
        "No further action needed. Tighten this IAM user's policy so a future leak exposes less.",
      confidence: 0.94,
      source: "bedrock",
    },
  },
];

export const mockIncidents: Incident[] = details.map((d) => d.incident);

export function getMockIncidentDetail(id: string): IncidentDetail | undefined {
  return details.find((d) => d.incident.id === id);
}
