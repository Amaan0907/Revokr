import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeverityBadge, SimulatedBadge, StatusBadge } from "@/components/incidents/badges";
import { btn, Card, Cell, PageHeader, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { IncidentSummary } from "@/components/overview/incident-summary";
import { getProjectDetail } from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/format";
import { getGitHubRepoDetails } from "@/lib/github-repo";
import { PROVIDER_LABEL, STATUS_META } from "@/lib/incident-meta";
import { getDataSource } from "@/lib/live-data";
import { getGitHubToken } from "@/lib/session";

export const metadata: Metadata = { title: "Project" };

const INCIDENT_COLUMNS = "1fr .8fr 1.2fr minmax(0,1.6fr) .9fr";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 truncate text-[13px]">{children}</dd>
    </div>
  );
}

function Ago({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <>—</>;
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {timeAgo(iso)}
    </time>
  );
}

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

// Everything about one project, on its own page: where its incidents stand, the repository's details
// and its incident list. The overview only lists the projects.
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();

  const { installed, sample, incidents } = project;
  const source = await getDataSource();
  const fullName = `${project.owner}/${project.name}`;

  const token = installed ? await getGitHubToken() : null;
  const github = token ? await getGitHubRepoDetails(project.owner, project.name, token) : null;
  const openOnGitHub = github?.htmlUrl ?? `https://github.com/${fullName}`;

  const unresolved = incidents.filter((incident) => STATUS_META[incident.status].group !== "resolved").length;
  const visibility = github ? (github.isPrivate ? "Private" : "Public") : sample ? (sample.isPrivate ? "Private" : "Public") : "—";
  const enabled = installed?.enabled ?? sample?.enabled ?? false;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Project"
        title={fullName}
        description={github?.description ?? undefined}
        actions={
          <>
            <Link href="/dashboard" className={btn({})}>
              All projects
            </Link>
            {installed && (
              <a href={openOnGitHub} target="_blank" rel="noreferrer" className={btn({ variant: "primary" })}>
                Open on GitHub
              </a>
            )}
          </>
        }
      />

      {/* A viewer who can't open incident pages gets the table below without these widgets: every
          link in them would lead to a page that isn't theirs. */}
      {source !== "empty" && incidents.length > 0 && (
        <IncidentSummary incidents={incidents} auditLog={project.auditLog} project={fullName} />
      )}

      <Card as="section" aria-label="Project details" className="p-[18px]">
        <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Visibility">{visibility}</Fact>
          {installed && <Fact label="Default branch">{github?.defaultBranch ?? "—"}</Fact>}
          {installed && <Fact label="Language">{github?.language ?? "—"}</Fact>}
          <Fact label="Last push">
            <Ago iso={github?.pushedAt ?? sample?.lastPushAt} />
          </Fact>
          {installed && (
            <Fact label="Installation">
              #{installed.installationId} · @{installed.installedBy}
            </Fact>
          )}
          {installed && <Fact label="Connected">{formatDateTime(installed.registeredAt)}</Fact>}
          <Fact label="Monitoring">{enabled ? "On" : "Off"}</Fact>
          <Fact label="Unresolved incidents">{unresolved}</Fact>
        </dl>
        {installed && !github && (
          <p className="m-0 mt-4 font-mono text-[11px] text-muted-foreground">
            GitHub details aren&apos;t available. Your sign-in couldn&apos;t read this repository from GitHub.
          </p>
        )}
        {sample && (
          <p className="m-0 mt-4 font-mono text-[11px] text-muted-foreground">
            This is a sample project. Connect a real repository from the overview to see your own.
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
                      <Ago iso={commit.date} />
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
            No secrets have been found in this project. Pushes to it are scanned as they arrive.
          </p>
        ) : (
          <TableScroller minWidth={620} label="Incidents in this project">
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
                  {source !== "empty" ? (
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
                  <Ago iso={incident.createdAt} />
                </Cell>
              </TableRow>
            ))}
          </TableScroller>
        )}
      </Card>
    </div>
  );
}
