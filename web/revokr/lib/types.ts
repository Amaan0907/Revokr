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
  | "failed";

export type AuditResult = "success" | "failure" | "pending";

export type AnalysisSource = "bedrock" | "template";

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
