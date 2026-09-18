import { PROVIDER_LABEL, SEVERITY_ORDER, STATUS_META, type StatusGroup } from "./incident-meta";
import type { Incident, Severity } from "./types";

export type IncidentView = "all" | "attention" | "active" | "resolved" | "closed";
export type SortKey = "risk" | "detected";
export type SortDirection = "asc" | "desc";

export interface IncidentQuery {
  view: IncidentView;
  severities: Severity[];
  search: string;
  sort: SortKey;
  direction: SortDirection;
}

export const DEFAULT_QUERY: IncidentQuery = {
  view: "all",
  severities: [],
  search: "",
  sort: "risk",
  direction: "desc",
};

export const VIEWS: { id: IncidentView; label: string; groups: StatusGroup[] | null }[] = [
  { id: "all", label: "All", groups: null },
  { id: "attention", label: "Needs attention", groups: ["attention", "failed"] },
  { id: "active", label: "In progress", groups: ["active"] },
  { id: "resolved", label: "Resolved", groups: ["resolved"] },
  { id: "closed", label: "Not supported", groups: ["closed"] },
];

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseIncidentQuery(params: RawParams): IncidentQuery {
  const view = first(params.view);
  return {
    view: VIEWS.find((v) => v.id === view)?.id ?? DEFAULT_QUERY.view,
    severities: (first(params.severity) ?? "")
      .split(",")
      .filter((s): s is Severity => (SEVERITY_ORDER as string[]).includes(s)),
    search: first(params.q)?.trim() ?? "",
    sort: first(params.sort) === "detected" ? "detected" : "risk",
    direction: first(params.dir) === "asc" ? "asc" : "desc",
  };
}

export function toSearchParams(query: IncidentQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.view !== DEFAULT_QUERY.view) params.set("view", query.view);
  if (query.severities.length) params.set("severity", query.severities.join(","));
  if (query.search) params.set("q", query.search);
  if (query.sort !== DEFAULT_QUERY.sort) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_QUERY.direction) params.set("dir", query.direction);
  return params;
}

export function isFiltered(query: IncidentQuery): boolean {
  return query.view !== "all" || query.severities.length > 0 || query.search !== "";
}

function inView(incident: Incident, view: IncidentView) {
  const groups = VIEWS.find((v) => v.id === view)?.groups;
  return !groups || groups.includes(STATUS_META[incident.status].group);
}

function matchesSeverity(incident: Incident, severities: Severity[]) {
  return severities.length === 0 || severities.includes(incident.severity);
}

function matchesSearch(incident: Incident, search: string) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [
    incident.secretType,
    PROVIDER_LABEL[incident.provider],
    `${incident.repositoryOwner}/${incident.repositoryName}`,
    incident.filePath,
    incident.commitSha,
  ].some((field) => field.toLowerCase().includes(needle));
}

export function applyIncidentQuery(incidents: Incident[], query: IncidentQuery): Incident[] {
  const sign = query.direction === "asc" ? 1 : -1;
  return incidents
    .filter(
      (incident) =>
        inView(incident, query.view) &&
        matchesSeverity(incident, query.severities) &&
        matchesSearch(incident, query.search),
    )
    .sort((a, b) => {
      const byDate = a.createdAt.localeCompare(b.createdAt);
      return sign * (query.sort === "risk" ? a.riskScore - b.riskScore || byDate : byDate);
    });
}

// Counts ignore the selected view so every tab shows how many incidents it would reveal.
export function countByView(incidents: Incident[], query: IncidentQuery): Record<IncidentView, number> {
  const base = incidents.filter(
    (incident) => matchesSeverity(incident, query.severities) && matchesSearch(incident, query.search),
  );
  return Object.fromEntries(
    VIEWS.map((v) => [v.id, base.filter((incident) => inView(incident, v.id)).length]),
  ) as Record<IncidentView, number>;
}
