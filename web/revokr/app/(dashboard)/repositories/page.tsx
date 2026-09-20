import type { Metadata } from "next";
import Link from "next/link";
import { btn, PageHeader } from "@/components/ds/primitives";
import { InstallGitHubApp } from "@/components/repositories/install-github-app";
import { ProviderCoverage } from "@/components/repositories/provider-coverage";
import { RepositoriesView } from "@/components/repositories/repositories-view";
import { InstalledRepositories } from "@/components/repositories/installed-repositories";
import { StateCard } from "@/components/states/state-card";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import { STATUS_META } from "@/lib/incident-meta";
import { getDataSource } from "@/lib/live-data";
import { getInstalledRepositories } from "@/lib/repositories-api";
import { getSession } from "@/lib/session";
import { mockIncidents, mockInstallation, mockRepositories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Repositories" };

interface RepositoriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RepositoriesPage({ searchParams }: RepositoriesPageProps) {
  // Only the sample data (the demo sign-in, or no backend) has made-up repositories. A real sign-in
  // sees the repositories its own GitHub account installed the App on, and nothing else.
  if ((await getDataSource()) !== "sample") {
    const session = await getSession();
    const installed = session?.mode === "github" ? await getInstalledRepositories(session.user.id) : [];

    return (
      <div className="flex flex-col gap-[18px]">
        <PageHeader eyebrow="Repositories" title="Your repositories" />
        {installed.length > 0 ? (
          <InstalledRepositories repositories={installed} />
        ) : (
          <StateCard
            size="page"
            eyebrow="Repositories"
            title="No repositories connected yet"
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
            {session?.mode === "github"
              ? "Install the GitHub App on a repository and it is listed here. If you just installed it and nothing appears, GitHub may not have delivered the installation event; check the App's Recent deliveries."
              : "This list shows the repositories your GitHub account installed the App on. Sign in with GitHub to see yours."}
          </StateCard>
        )}
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
