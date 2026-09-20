// The one place dashboard pages get incidents and audit rows from. With REVOKR_API_URL set they come
// from the Go API; with it unset the UI runs on the sample data in mock-data.ts so it works with no
// backend. The two never mix: when the URL is set and the API fails these functions throw (an
// ApiError, shown by (dashboard)/error.tsx), because fake incidents must not pass for real ones.
import { cache } from "react";
import { ANALYSIS_TIMEOUT_MS, ApiError, apiConfigured, apiFetch } from "./api";
import {
  toAction,
  toAnalysis,
  toAuditEntry,
  toIncident,
  type ActionsResponse,
  type ApiAnalysis,
  type ApiIncident,
  type AuditLogsResponse,
  type IncidentsResponse,
} from "./incident-api";
import {
  getMockIncidentDetail,
  MOCK_NOW,
  mockAuditLog,
  mockIncidents,
  mockInstallation,
  mockRepositories,
} from "./mock-data";
import type {
  AuditLogEntry,
  GitHubInstallation,
  Incident,
  IncidentDetail,
  IncidentProgress,
} from "./types";

// The Go API returns at most 100 rows of either list until it has paging.
const PAGE_LIMIT = 100;

// Cached per request, so the layout and the page share one API call.
export const getIncidents = cache(async (): Promise<Incident[]> => {
  if (!apiConfigured()) return mockIncidents;
  const { incidents } = await apiFetch<IncidentsResponse>(`/api/incidents?limit=${PAGE_LIMIT}`);
  return incidents.map(toIncident);
});

// Newest first, across every incident.
export const getAuditFeed = cache(async (): Promise<AuditLogEntry[]> => {
  if (!apiConfigured()) return mockAuditLog;
  const { audit_logs } = await apiFetch<AuditLogsResponse>(`/api/audit?limit=${PAGE_LIMIT}`);
  return audit_logs.map(toAuditEntry);
});

// The incident, its actions and its audit log: everything on the detail page that changes while a
// rotation runs. It never asks for the analysis, so polling it never calls a model. Undefined means
// the API has no such incident. Only used with a backend configured; sample mode reads mock-data.
export async function getIncidentProgress(id: string): Promise<IncidentProgress | undefined> {
  const path = `/api/incidents/${encodeURIComponent(id)}`;
  try {
    const [incident, actions, audit] = await Promise.all([
      apiFetch<ApiIncident>(path),
      apiFetch<ActionsResponse>(`${path}/actions`),
      apiFetch<AuditLogsResponse>(`${path}/audit`),
    ]);
    return {
      incident: toIncident(incident),
      actions: actions.actions.map(toAction),
      auditLog: audit.audit_logs.map(toAuditEntry),
    };
  } catch (error) {
    // The Go API answers 404 for an unknown id (and for an id that isn't a UUID).
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

// The analysis is explanatory, not part of the incident's state, so if the analyst can't answer the
// page still renders and the panel says it isn't written yet.
async function getAnalysis(id: string) {
  try {
    const analysis = await apiFetch<ApiAnalysis>(
      `/api/incidents/${encodeURIComponent(id)}/analysis`,
      {},
      ANALYSIS_TIMEOUT_MS,
    );
    return toAnalysis(analysis);
  } catch {
    return null;
  }
}

// Cached per request so the page and its metadata share one call, and one analysis request.
export const getIncidentDetail = cache(async (id: string): Promise<IncidentDetail | undefined> => {
  if (!apiConfigured()) return getMockIncidentDetail(id);
  const progress = await getIncidentProgress(id);
  if (!progress) return undefined;
  return { ...progress, analysis: await getAnalysis(id) };
});

// What the empty states need to know about setup. Repositories and the GitHub installation have no
// API endpoint yet, so with a backend configured this reports nothing rather than sample values.
export function getSetupContext(): {
  installation: GitHubInstallation | null;
  monitored: number;
  lastPushAt: string | null;
} {
  if (apiConfigured()) return { installation: null, monitored: 0, lastPushAt: null };

  const monitored = mockRepositories.filter((repository) => repository.enabled);
  const lastPushAt =
    monitored
      .map((repository) => repository.lastPushAt)
      .filter((time): time is string => time !== null)
      .sort()
      .at(-1) ?? null;
  return { installation: mockInstallation, monitored: monitored.length, lastPushAt };
}

// The instant "how long ago" is measured from: the sample data's own clock, or the real one.
export function getNow(): number {
  return apiConfigured() ? Date.now() : MOCK_NOW;
}
