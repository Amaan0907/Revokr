import type { Metadata } from "next";
import { PageHeader } from "@/components/ds/primitives";
import { InstallGitHubApp } from "@/components/repositories/install-github-app";
import { ProviderCoverage } from "@/components/repositories/provider-coverage";
import { RepositoriesView } from "@/components/repositories/repositories-view";
import { STATUS_META } from "@/lib/incident-meta";
import { mockIncidents, mockInstallation, mockRepositories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Repositories" };

interface RepositoriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RepositoriesPage({ searchParams }: RepositoriesPageProps) {
  // ?preview=empty shows the not-installed state until this reads a real installation.
  const installation = (await searchParams).preview === "empty" ? null : mockInstallation;

  const openIncidents: Record<string, number> = {};
  for (const incident of mockIncidents) {
    if (["resolved", "closed"].includes(STATUS_META[incident.status].group)) continue;
    openIncidents[incident.repositoryId] = (openIncidents[incident.repositoryId] ?? 0) + 1;
  }

  if (!installation) {
    return (
      <div className="flex flex-col gap-[18px]">
        <PageHeader eyebrow="Repositories" title="Nothing is being monitored yet" />
        <InstallGitHubApp />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Repositories"
        title="Monitor the repos you choose"
        description="Opt in per repository. Revokr scans pushes only where monitoring is on, and remediation depends on the provider — detection is never the same as a fix."
      />
      <RepositoriesView installation={installation} repositories={mockRepositories} openIncidents={openIncidents} />
      <ProviderCoverage />
    </div>
  );
}
