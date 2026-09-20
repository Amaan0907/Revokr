// The repositories a signed-in GitHub user has installed the Revokr GitHub App on, from the Go API.
import { apiFetch } from "./api";

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

// The API scopes the list to this GitHub user id, and refuses to answer without one.
export async function getInstalledRepositories(githubUserId: string): Promise<InstalledRepository[]> {
  const { repositories } = await apiFetch<{ repositories: ApiRepository[] }>(
    `/api/repositories?installer_github_id=${encodeURIComponent(githubUserId)}`,
  );
  return repositories.map((repository) => ({
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    enabled: repository.enabled,
    installationId: repository.installation_id,
    installedBy: repository.installed_by,
    registeredAt: repository.registered_at,
    openIncidents: repository.open_incidents,
  }));
}
