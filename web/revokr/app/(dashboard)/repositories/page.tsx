import type { Metadata } from "next";
import Link from "next/link";
import { btn, PageHeader } from "@/components/ds/primitives";
import { InstallGitHubApp } from "@/components/repositories/install-github-app";
import { ProviderCoverage } from "@/components/repositories/provider-coverage";
import { RepositoriesView } from "@/components/repositories/repositories-view";
import { StateCard } from "@/components/states/state-card";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import { STATUS_META } from "@/lib/incident-meta";
import { getDataSource } from "@/lib/live-data";
import { mockIncidents, mockInstallation, mockRepositories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Repositories" };

interface RepositoriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RepositoriesPage({ searchParams }: RepositoriesPageProps) {
  // There is no API endpoint for repositories or installations yet, so only the sample data has a
  // list to show. A real sign-in gets an honest empty state, never made-up repositories.
  if ((await getDataSource()) !== "sample") {
    return (
      <div className="flex flex-col gap-[18px]">
        <PageHeader eyebrow="Repositories" title="Your repositories" />
        <StateCard
          size="page"
          eyebrow="Repositories"
          title="This page doesn't list repositories yet"
          actions={
            <>
              <a href={GITHUB_APP_INSTALL_URL} className={btn({ variant: "primary", size: "lg" })}>
                Install GitHub App
              </a>
              <Link href="/incidents" className={btn({ size: "lg" })}>
                View incidents
              </Link>
            </>
          }
        >
          Repositories are registered when you install the GitHub App on them, and any incident found in
          one appears under Incidents. The repository list itself isn&apos;t connected to the API yet.
        </StateCard>
      </div>
    );
  }

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
