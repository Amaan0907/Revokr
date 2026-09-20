// The one place dashboard pages get incidents and audit rows from. With REVOKR_API_URL set they come
// from the Go API; with it unset the UI runs on the sample data in mock-data.ts so it works with no
// backend. The two never mix: when the URL is set and the API fails these functions throw (an
// ApiError, shown by (dashboard)/error.tsx), because fake incidents must not pass for real ones.
import { cache } from "react";
import { apiConfigured, apiFetch } from "./api";
import {
  toAuditEntry,
  toIncident,
  type AuditLogsResponse,
  type IncidentsResponse,
} from "./incident-api";
import { MOCK_NOW, mockAuditLog, mockIncidents, mockInstallation, mockRepositories } from "./mock-data";
import type { AuditLogEntry, GitHubInstallation, Incident } from "./types";

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
