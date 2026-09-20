// The repositories a signed-in GitHub user has installed the Revokr GitHub App on, from the Go API.
import { ApiError, apiFetch } from "./api";
import { toIncident, type ApiIncident } from "./incident-api";
import type { Incident } from "./types";

export interface InstalledRepository {
  id: string;
  owner: string;
  name: string;
  enabled: boolean;
  installationId: number;
  installedBy: string;
  registeredAt: string;
  openIncidents: number;
}

interface ApiRepository {
  id: string;
  owner: string;
  name: string;
  enabled: boolean;
  installation_id: number;
  installed_by: string;
  registered_at: string;
  open_incidents: number;
}

function toInstalled(repository: ApiRepository): InstalledRepository {
  return {
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    enabled: repository.enabled,
    installationId: repository.installation_id,
    installedBy: repository.installed_by,
    registeredAt: repository.registered_at,
    openIncidents: repository.open_incidents,
  };
}

// The API scopes the list to this GitHub user id, and refuses to answer without one.
export async function getInstalledRepositories(githubUserId: string): Promise<InstalledRepository[]> {
  const { repositories } = await apiFetch<{ repositories: ApiRepository[] }>(
    `/api/repositories?installer_github_id=${encodeURIComponent(githubUserId)}`,
  );
  return repositories.map(toInstalled);
}

// One repository and its incidents. Undefined when it doesn't exist or belongs to another account:
// the API answers 404 for both, so this page can't be used to probe other people's repositories.
export async function getInstalledRepository(
  githubUserId: string,
  id: string,
): Promise<{ repository: InstalledRepository; incidents: Incident[] } | undefined> {
  try {
    const body = await apiFetch<{ repository: ApiRepository; incidents: ApiIncident[] }>(
      `/api/repositories/${encodeURIComponent(id)}?installer_github_id=${encodeURIComponent(githubUserId)}`,
    );
    return { repository: toInstalled(body.repository), incidents: body.incidents.map(toIncident) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}
