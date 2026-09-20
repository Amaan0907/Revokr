// Mirrors the Postgres schema in /migrations and the Go types in /internal.

export type Provider =
  | "aws"
  | "openai"
  | "github"
  | "gcp"
  | "stripe"
  | "slack"
  | "generic";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "DETECTED"
  | "VALIDATING"
  | "AWAITING_APPROVAL"
  | "ROTATING"
  | "VERIFYING"
  | "RESOLVED"
  | "FAILED"
  | "REQUIRES_USER_ACTION"
  | "NOT_SUPPORTED";

export type ActionType =
  | "VALIDATE_CREDENTIAL"
  | "ROTATE_CREDENTIAL"
  | "UPDATE_GITHUB_SECRET"
  | "DISABLE_OLD_CREDENTIAL"
  | "SEND_NOTIFICATION"
  | "CLEAN_HISTORY";

export type ActionStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type AuditAction =
  | "detected"
  | "validated"
  | "risk_scored"
  | "auth_requested"
  | "approved"
  | "denied"
  | "key_created"
  | "old_key_disabled"
  | "gh_secret_updated"
  | "verified"
  | "resolved"
  | "failed"
  | "not_supported";

export type AuditResult = "success" | "failure" | "pending";

// "openai" is what the Go analyst reports today; "bedrock" is kept for the planned Bedrock analyst.
export type AnalysisSource = "bedrock" | "openai" | "template";

// incidents.risk_factors is JSONB with no fixed shape yet; this is the shape the UI renders.
export interface RiskFactor {
  factor: string;
  points: number;
  detail?: string;
}

export interface Incident {
  id: string;
  repositoryId: string;
  repositoryOwner: string;
  repositoryName: string;
  commitSha: string;
  filePath: string;
  lineNumber: number | null;
  provider: Provider;
  secretType: string;
  fingerprint: string;
  maskedValue: string;
  isLive: boolean | null;
  severity: Severity;
  riskScore: number;
  riskFactors: RiskFactor[];
  status: IncidentStatus;
  simulated: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RemediationAction {
  id: string;
  incidentId: string;
  actionType: ActionType;
  status: ActionStatus;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  incidentId: string;
  actor: string;
  action: AuditAction;
  result: AuditResult;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

export interface Analysis {
  summary: string;
  whyItMatters: string;
  recommendedResponse: string;
  confidence: number;
  source: AnalysisSource;
}

export interface IncidentDetail {
  incident: Incident;
  actions: RemediationAction[];
  auditLog: AuditLogEntry[];
  analysis: Analysis | null;
}

// What changes while a rotation runs. Polling reads this and never the analysis, because each
// analysis request may call a model.
export type IncidentProgress = Omit<IncidentDetail, "analysis">;

// GET /api/repositories. `enabled` is the opt-in: pushes are only scanned where it is on.
export interface Repository {
  id: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  // PATCH /api/repositories/:id { is_production } adds +20 to an incident's risk score.
  isProduction: boolean;
  enabled: boolean;
  lastPushAt: string | null;
}

export interface GitHubInstallation {
  installationId: number;
  installedBy: string;
  organization: string;
}

// What Revokr can do once it has detected a secret for a provider.
export type RemediationSupport = "full" | "conditional" | "optional" | "manual";

export interface ProviderCoverage {
  provider: Provider;
  name: string;
  secretTypes: string;
  remediation: RemediationSupport;
  note: string;
}

export type NotifyChannel = "slack" | "discord";

// How an incident that Revokr did not rotate itself was closed.
export type Resolution = "manual" | "false_positive";
