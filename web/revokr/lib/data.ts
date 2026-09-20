// The one place dashboard pages get incidents and audit rows from. With REVOKR_API_URL set they come
// from the Go API; with it unset the UI runs on the sample data in mock-data.ts so it works with no
// backend. The two never mix: when the URL is set and the API fails these functions throw (an
// ApiError, shown by (dashboard)/error.tsx), because fake incidents must not pass for real ones.
import { cache } from "react";
import { ANALYSIS_TIMEOUT_MS, ApiError, apiFetch } from "./api";
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
import { getDataSource } from "./live-data";
import { STATUS_META } from "./incident-meta";
import { getInstalledRepositories, getInstalledRepository, type InstalledRepository } from "./repositories-api";
import { getSession } from "./session";
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
  Project,
  Repository,
} from "./types";

// The Go API returns at most 100 rows of either list until it has paging.
const PAGE_LIMIT = 100;

// Cached per request, so the layout and the page share one API call.
export const getIncidents = cache(async (): Promise<Incident[]> => {
  const source = await getDataSource();
  if (source === "sample") return mockIncidents;
  if (source === "empty") return [];
  const { incidents } = await apiFetch<IncidentsResponse>(`/api/incidents?limit=${PAGE_LIMIT}`);
  return incidents.map(toIncident);
});

// Newest first, across every incident.
export const getAuditFeed = cache(async (): Promise<AuditLogEntry[]> => {
  const source = await getDataSource();
  if (source === "sample") return mockAuditLog;
  if (source === "empty") return [];
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
  const source = await getDataSource();
  if (source === "sample") return getMockIncidentDetail(id);
  if (source === "empty") return undefined;
  const progress = await getIncidentProgress(id);
  if (!progress) return undefined;
  return { ...progress, analysis: await getAnalysis(id) };
});

// The signed-in GitHub account's installed repositories, once per request. It only decorates the
// overview and the empty states, so an API failure here must not take a page down.
const installedRepositories = cache(
  (githubUserId: string): Promise<InstalledRepository[]> => getInstalledRepositories(githubUserId).catch(() => []),
);

// The cards on the overview. Sample data lists the sample repositories, a GitHub sign-in lists the
// repositories it installed the App on, and any other real sign-in has none.
export const getProjects = cache(async (): Promise<Project[]> => {
  const source = await getDataSource();

  if (source === "sample") {
    const open: Record<string, number> = {};
    for (const incident of mockIncidents) {
      if (["resolved", "closed"].includes(STATUS_META[incident.status].group)) continue;
      open[incident.repositoryId] = (open[incident.repositoryId] ?? 0) + 1;
    }
    return mockRepositories.map((repository) => ({
      id: repository.id,
      owner: repository.owner,
      name: repository.name,
      href: `/repositories/${repository.id}`,
      openIncidents: open[repository.id] ?? 0,
    }));
  }

  const session = await getSession();
  if (session?.mode !== "github") return [];
  return (await installedRepositories(session.user.id)).map((repository) => ({
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    href: `/repositories/${repository.id}`,
    openIncidents: repository.openIncidents,
  }));
});

// Everything one project's page shows. Exactly one of installed and sample is set: installed for a
// repository the signed-in GitHub account connected, sample for a repository of the sample data.
export interface ProjectDetail {
  owner: string;
  name: string;
  incidents: Incident[];
  auditLog: AuditLogEntry[];
  installed: InstalledRepository | null;
  sample: Repository | null;
}

// Undefined when there is no such project for this viewer, which the page turns into "not found".
export const getProjectDetail = cache(async (id: string): Promise<ProjectDetail | undefined> => {
  const source = await getDataSource();

  if (source === "sample") {
    const repository = mockRepositories.find((candidate) => candidate.id === id);
    if (!repository) return undefined;
    return {
      owner: repository.owner,
      name: repository.name,
      incidents: mockIncidents.filter((incident) => incident.repositoryId === id),
      auditLog: mockAuditLog,
      installed: null,
      sample: repository,
    };
  }

  const session = await getSession();
  if (session?.mode !== "github") return undefined;

  // The API only answers for a repository this GitHub account installed, and says 404 otherwise.
  const found = await getInstalledRepository(session.user.id, id);
  if (!found) return undefined;
  return {
    owner: found.repository.owner,
    name: found.repository.name,
    incidents: found.incidents,
    // The audit log is only readable by viewers allowed to see live data.
    auditLog: source === "live" ? await getAuditFeed() : [],
    installed: found.repository,
    sample: null,
  };
});

// What the empty states need to know about setup. A GitHub sign-in gets it from the repositories that
// account installed the App on; any other real sign-in gets nothing rather than sample values.
export async function getSetupContext(): Promise<{
  installation: GitHubInstallation | null;
  monitored: number;
  lastPushAt: string | null;
}> {
  if ((await getDataSource()) !== "sample") {
    const session = await getSession();
    if (session?.mode !== "github") return { installation: null, monitored: 0, lastPushAt: null };

    const installed = await installedRepositories(session.user.id);
    const first = installed[0];
    return {
      installation: first
        ? { installationId: first.installationId, installedBy: first.installedBy, organization: first.owner }
        : null,
      monitored: installed.filter((repository) => repository.enabled).length,
      lastPushAt: null,
    };
  }

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
export async function getNow(): Promise<number> {
  return (await getDataSource()) === "sample" ? MOCK_NOW : Date.now();
}
