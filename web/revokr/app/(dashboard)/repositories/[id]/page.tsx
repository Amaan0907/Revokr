import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeverityBadge, SimulatedBadge, StatusBadge } from "@/components/incidents/badges";
import { btn, Card, Cell, PageHeader, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { formatDateTime, timeAgo } from "@/lib/format";
import { getGitHubRepoDetails } from "@/lib/github-repo";
import { PROVIDER_LABEL } from "@/lib/incident-meta";
import { getDataSource } from "@/lib/live-data";
import { getInstalledRepository } from "@/lib/repositories-api";
import { getGitHubToken, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Repository" };

const INCIDENT_COLUMNS = "1fr .8fr 1.2fr minmax(0,1.6fr) .9fr";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 truncate text-[13px]">{children}</dd>
    </div>
  );
}

interface RepositoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { id } = await params;
  const session = await getSession();
  const source = await getDataSource();
  // Only a GitHub sign-in has an installer id to look repositories up by, and the sample data has no
  // real repositories to open.
  if (!session || session.mode !== "github" || source === "sample") notFound();

  const found = await getInstalledRepository(session.user.id, id);
  if (!found) notFound();
  const { repository, incidents } = found;

  const token = await getGitHubToken();
  const github = token ? await getGitHubRepoDetails(repository.owner, repository.name, token) : null;
  const fullName = `${repository.owner}/${repository.name}`;
  const openOnGitHub = github?.htmlUrl ?? `https://github.com/${fullName}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Repository"
        title={fullName}
        description={github?.description ?? undefined}
        actions={
          <>
            <Link href="/repositories" className={btn({})}>
              All repositories
            </Link>
            <a href={openOnGitHub} target="_blank" rel="noreferrer" className={btn({ variant: "primary" })}>
              Open on GitHub
            </a>
          </>
        }
      />

      <Card as="section" aria-label="Repository details" className="p-[18px]">
        <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Visibility">{github ? (github.isPrivate ? "Private" : "Public") : "—"}</Fact>
          <Fact label="Default branch">{github?.defaultBranch ?? "—"}</Fact>
          <Fact label="Language">{github?.language ?? "—"}</Fact>
          <Fact label="Last push">
            {github?.pushedAt ? (
              <time dateTime={github.pushedAt} suppressHydrationWarning>
                {timeAgo(github.pushedAt)}
              </time>
            ) : (
              "—"
            )}
          </Fact>
          <Fact label="Installation">
            #{repository.installationId} · @{repository.installedBy}
          </Fact>
          <Fact label="Connected">{formatDateTime(repository.registeredAt)}</Fact>
          <Fact label="Monitoring">{repository.enabled ? "On" : "Off"}</Fact>
          <Fact label="Unresolved incidents">{repository.openIncidents}</Fact>
        </dl>
        {!github && (
          <p className="m-0 mt-4 font-mono text-[11px] text-muted-foreground">
            GitHub details aren&apos;t available. Your sign-in couldn&apos;t read this repository from GitHub.
          </p>
        )}
      </Card>

      {github && github.commits.length > 0 && (
        <Card as="section" aria-labelledby="commits-heading" className="overflow-hidden">
          <div className="border-b border-white/8 px-[18px] py-4">
            <h2 id="commits-heading" className="m-0 text-[14px] font-medium">
              Recent commits
            </h2>
          </div>
          <ul className="m-0 list-none p-0">
            {github.commits.map((commit) => (
              <li
                key={commit.sha}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/6 px-[18px] py-3 last:border-b-0"
              >
                <a
                  href={commit.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-[#f5f5f7] hover:underline"
                >
                  {commit.sha.slice(0, 7)}
                </a>
                <span className="min-w-0 flex-1 truncate text-[13px]">{commit.message}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  @{commit.author}
                  {commit.date && (
                    <>
                      {" · "}
                      <time dateTime={commit.date} suppressHydrationWarning>
                        {timeAgo(commit.date)}
                      </time>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card as="section" aria-labelledby="incidents-heading" className="overflow-hidden">
        <div className="border-b border-white/8 px-[18px] py-4">
          <h2 id="incidents-heading" className="m-0 text-[14px] font-medium">
            Incidents
          </h2>
        </div>
        {incidents.length === 0 ? (
          <p className="m-0 px-[18px] py-6 text-[13px] text-muted-foreground">
            No secrets have been found in this repository. Pushes to it are scanned as they arrive.
          </p>
        ) : (
          <TableScroller minWidth={620} label="Incidents in this repository">
            <TableHead
              columns={INCIDENT_COLUMNS}
              labels={["Status", "Severity", "Secret", "File", { label: "Found", align: "right" }]}
            />
            {incidents.map((incident) => (
              <TableRow key={incident.id} columns={INCIDENT_COLUMNS} className="py-[13px]">
                <Cell>
                  <StatusBadge status={incident.status} />
                </Cell>
                <Cell>
                  <SeverityBadge severity={incident.severity} />
                </Cell>
                <Cell className="font-mono text-[12px]">
                  {source === "live" ? (
                    <Link href={`/incidents/${incident.id}`} className="hover:underline">
                      {PROVIDER_LABEL[incident.provider]} · {incident.maskedValue}
                    </Link>
                  ) : (
                    <>
                      {PROVIDER_LABEL[incident.provider]} · {incident.maskedValue}
                    </>
                  )}
                  {incident.simulated && <SimulatedBadge className="ml-2" />}
                </Cell>
                <Cell className="overflow-hidden text-ellipsis font-mono text-[12px] text-muted-foreground">
                  {incident.filePath}
                  {incident.lineNumber ? `:${incident.lineNumber}` : ""}
                </Cell>
                <Cell className="text-right text-[12px] text-muted-foreground">
                  <time dateTime={incident.createdAt} suppressHydrationWarning>
                    {timeAgo(incident.createdAt)}
                  </time>
                </Cell>
              </TableRow>
            ))}
          </TableScroller>
        )}
      </Card>
    </div>
  );
}
