// Go API JSON -> the camelCase types the UI renders. The Go side sends snake_case rows; the
// analyst's fields are already camelCase. Nothing here calls the API: see lib/api.ts for that.
import type {
  ActionStatus,
  ActionType,
  Analysis,
  AnalysisSource,
  AuditAction,
  AuditLogEntry,
  AuditResult,
  Incident,
  IncidentStatus,
  Provider,
  RemediationAction,
  RiskFactor,
  Severity,
} from "./types";

// The value sets below (provider, severity, status, audit action) are enforced by CHECK constraints
// in /migrations, so they are cast rather than re-validated.

export interface ApiIncident {
  id: string;
  repository_id: string;
  repository_owner?: string;
  repository_name?: string;
  commit_sha: string;
  file_path: string;
  line_number?: number | null;
  provider: string;
  secret_type: string;
  fingerprint: string;
  masked_value: string;
  is_live?: boolean | null;
  severity: string;
  risk_score: number;
  risk_factors?: unknown;
  status: string;
  simulated: boolean;
  created_at: string;
  resolved_at?: string | null;
}

export interface ApiAction {
  id: string;
  incident_id: string;
  action_type: string;
  status: string;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ApiAuditLog {
  id: string;
  incident_id: string;
  actor: string;
  action: string;
  result: string;
  metadata?: unknown;
  timestamp: string;
}

// GET /api/incidents/:id/analysis. `source` is "openai" or "template" and is passed through as
// reported: the panel must never claim a different author than the one that wrote the text.
export interface ApiAnalysis {
  summary: string;
  whyItMatters: string;
  recommendedResponse: string;
  confidence: number;
  source: string;
}

export interface IncidentsResponse {
  incidents: ApiIncident[];
}

export interface AuditLogsResponse {
  audit_logs: ApiAuditLog[];
}

export interface ActionsResponse {
  actions: ApiAction[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function camelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

// The engine writes {name, points}; the UI renders {factor, points}. Accepts either.
function toRiskFactors(raw: unknown): RiskFactor[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): RiskFactor[] => {
    if (!isRecord(item)) return [];
    const factor = item.factor ?? item.name;
    if (typeof factor !== "string" || typeof item.points !== "number") return [];
    return [
      {
        factor,
        points: item.points,
        ...(typeof item.detail === "string" ? { detail: item.detail } : {}),
      },
    ];
  });
}

export function toIncident(row: ApiIncident): Incident {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    repositoryOwner: row.repository_owner ?? "",
    repositoryName: row.repository_name ?? "",
    commitSha: row.commit_sha,
    filePath: row.file_path,
    // The API reports 0 when the detector had no line number.
    lineNumber: row.line_number && row.line_number > 0 ? row.line_number : null,
    provider: row.provider as Provider,
    secretType: row.secret_type,
    fingerprint: row.fingerprint,
    maskedValue: row.masked_value,
    isLive: row.is_live ?? null,
    severity: row.severity as Severity,
    riskScore: row.risk_score,
    riskFactors: toRiskFactors(row.risk_factors),
    status: row.status as IncidentStatus,
    simulated: row.simulated,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? null,
  };
}

export function toAction(row: ApiAction): RemediationAction {
  return {
    id: row.id,
    incidentId: row.incident_id,
    actionType: row.action_type as ActionType,
    status: row.status as ActionStatus,
    error: row.error ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
  };
}

// Audit metadata keys are snake_case in the database (is_live) and camelCase in the UI (isLive), and
// only the top level is converted. The detector's file_path/line_number land on the path/line keys
// that the activity timeline merges into its single "file" row.
const METADATA_KEY_ALIASES: Record<string, string> = {
  file_path: "path",
  line_number: "line",
};

function toMetadata(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [METADATA_KEY_ALIASES[key] ?? camelCase(key), value]),
  );
}

export function toAuditEntry(row: ApiAuditLog): AuditLogEntry {
  return {
    id: row.id,
    incidentId: row.incident_id,
    actor: row.actor,
    action: row.action as AuditAction,
    result: row.result as AuditResult,
    metadata: toMetadata(row.metadata),
    timestamp: row.timestamp,
  };
}

export function toAnalysis(row: ApiAnalysis): Analysis {
  return {
    summary: row.summary,
    whyItMatters: row.whyItMatters,
    recommendedResponse: row.recommendedResponse,
    confidence: row.confidence,
    source: row.source as AnalysisSource,
  };
}
