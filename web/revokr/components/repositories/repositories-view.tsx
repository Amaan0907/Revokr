"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Btn, btn, Card, Cell, PILL, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { Switch } from "@/components/ds/switch";
import { timeAgo } from "@/lib/format";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import type { GitHubInstallation, Repository } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RepositoriesViewProps {
  installation: GitHubInstallation;
  repositories: Repository[];
  // Open (not resolved or closed) incidents per repository id.
  openIncidents: Record<string, number>;
}

const COLUMNS = "minmax(0,2.2fr) .8fr .9fr .9fr .9fr 1fr";

const fullName = (repository: Repository) => `${repository.owner}/${repository.name}`;

function InstallationCard({ installation, visible }: { installation: GitHubInstallation; visible: number }) {
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const refresh = () => {
    setRefreshing(true);
    timer.current = setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <Card as="section" aria-label="GitHub App installation" className="flex flex-wrap items-center gap-4 p-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-[7px] rounded-full bg-resolved" />
          <span className="text-[14px] font-medium">GitHub App installed</span>
        </div>
        <span className="font-mono text-[11px] leading-[1.6] text-muted-foreground">
          installation_id {installation.installationId} · installed by @{installation.installedBy} · org{" "}
          {installation.organization} · {visible} repositories visible
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href="https://github.com/settings/installations"
          target="_blank"
          rel="noreferrer"
          className={btn({ variant: "primary" })}
        >
          Manage installation
        </a>
        <a
          href={GITHUB_APP_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className={btn({ variant: "secondary" })}
        >
          Install on more repositories
        </a>
        <Btn onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh repo list"}
        </Btn>
      </div>
    </Card>
  );
}

export function RepositoriesView({ installation, repositories, openIncidents }: RepositoriesViewProps) {
  const [rows, setRows] = useState(repositories);
  const [filter, setFilter] = useState("");

  const monitored = rows.filter((row) => row.enabled).length;
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? rows.filter((row) => fullName(row).toLowerCase().includes(needle)) : rows;
  }, [rows, filter]);

  const update = (id: string, changes: Partial<Repository>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  return (
    <>
      <InstallationCard installation={installation} visible={rows.length} />

      <Card as="section" aria-labelledby="repos-heading" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-white/8 px-[18px] py-4">
          <h2 id="repos-heading" className="m-0 text-[14px] font-medium">
            {rows.length} repositories
          </h2>
          <span aria-live="polite" className="font-mono text-[11px] text-muted-foreground">
            {monitored} monitored
          </span>
          <label className={cn(PILL, "ml-auto py-1.5 focus-within:border-white/20")}>
            <span aria-hidden className="font-mono text-[11px] text-muted-foreground">
              ⌕
            </span>
            <input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter repositories"
              aria-label="Filter repositories"
              className="w-[150px] bg-transparent text-[12px] text-[#f5f5f7] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
        </div>

        <TableScroller minWidth={640} label="Repositories">
          <TableHead
            columns={COLUMNS}
            labels={["Repository", "Visibility", "Flag", "Incidents", "Last push", { label: "Monitored", align: "right" }]}
          />
          {visible.map((row) => {
            const name = fullName(row);
            const open = openIncidents[row.id] ?? 0;
            return (
              <TableRow key={row.id} columns={COLUMNS} className="py-[13px]">
                <Cell className="overflow-hidden text-ellipsis">
                  <Link
                    href={`/incidents?q=${encodeURIComponent(name)}`}
                    className="font-mono text-[13px] text-[#f5f5f7] hover:underline"
                  >
                    {name}
                  </Link>
                </Cell>
                <Cell className="text-[12px] text-muted-foreground">{row.isPrivate ? "Private" : "Public"}</Cell>
                <Cell>
                  <button
                    type="button"
                    aria-pressed={row.isProduction}
                    title="Production repositories add +20 to an incident's risk score"
                    onClick={() => update(row.id, { isProduction: !row.isProduction })}
                    className={cn(
                      "cursor-pointer font-mono text-[10px] font-medium uppercase tracking-[.1em] hover:underline",
                      row.isProduction ? "text-high" : "text-muted-foreground",
                    )}
                  >
                    {row.isProduction ? "Production" : "—"}
                    <span className="sr-only">{row.isProduction ? "" : "Not production"}</span>
                  </button>
                </Cell>
                <Cell className={cn("text-[12px]", open > 0 ? "text-critical" : "text-muted-foreground")}>
                  {open > 0 ? `${open} open` : "None"}
                </Cell>
                <Cell className="text-[12px] text-muted-foreground">
                  {row.lastPushAt ? (
                    <time dateTime={row.lastPushAt} suppressHydrationWarning>
                      {timeAgo(row.lastPushAt)}
                    </time>
                  ) : (
                    "Never"
                  )}
                </Cell>
                <Cell className="flex items-center justify-end gap-[9px]">
                  <span aria-hidden className="font-mono text-[11px] text-muted-foreground">
                    {row.enabled ? "Monitored" : "Off"}
                  </span>
                  <Switch
                    checked={row.enabled}
                    onCheckedChange={(enabled) => update(row.id, { enabled })}
                    aria-label={`Monitor ${name}`}
                  />
                </Cell>
              </TableRow>
            );
          })}
        </TableScroller>

        {visible.length === 0 && (
          <div className="flex flex-col items-start gap-2.5 px-[18px] py-6">
            <span className="text-[14px] font-medium">No repositories match &ldquo;{filter}&rdquo;</span>
            <Btn size="sm" onClick={() => setFilter("")}>
              Clear filter
            </Btn>
          </div>
        )}

        <p className="m-0 px-[18px] py-3 font-mono text-[10px] text-muted-foreground">
          The Production flag adds +20 to an incident&apos;s risk score. Click a repository to see its incidents.
        </p>
      </Card>
    </>
  );
}
