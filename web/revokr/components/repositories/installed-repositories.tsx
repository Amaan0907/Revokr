import Link from "next/link";
import { btn, Card, Cell, TableHead, TableRow, TableScroller } from "@/components/ds/primitives";
import { timeAgo } from "@/lib/format";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import type { InstalledRepository } from "@/lib/repositories-api";
import { cn } from "@/lib/utils";

const COLUMNS = "minmax(0,2.2fr) 1.3fr .9fr .9fr";

// The repositories the signed-in user has installed the GitHub App on, straight from the API.
export function InstalledRepositories({ repositories }: { repositories: InstalledRepository[] }) {
  return (
    <Card as="section" aria-labelledby="installed-heading" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/8 px-[18px] py-4">
        <h2 id="installed-heading" className="m-0 text-[14px] font-medium">
          {repositories.length} {repositories.length === 1 ? "repository" : "repositories"}
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {repositories.filter((repository) => repository.enabled).length} monitored
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href="https://github.com/settings/installations" target="_blank" rel="noreferrer" className={btn({})}>
            Manage installation
          </a>
          <a
            href={GITHUB_APP_INSTALL_URL}
            target="_blank"
            rel="noreferrer"
            className={btn({ variant: "primary" })}
          >
            Install on more repositories
          </a>
        </div>
      </div>

      <TableScroller minWidth={560} label="Installed repositories">
        <TableHead
          columns={COLUMNS}
          labels={["Repository", "Installation", "Unresolved", { label: "Registered", align: "right" }]}
        />
        {repositories.map((repository) => {
          const name = `${repository.owner}/${repository.name}`;
          return (
            <TableRow key={repository.id} columns={COLUMNS} className="py-[13px]">
              <Cell className="overflow-hidden text-ellipsis">
                <Link
                  href={`/repositories/${repository.id}`}
                  className="font-mono text-[13px] text-[#f5f5f7] hover:underline"
                >
                  {name}
                </Link>
                {!repository.enabled && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                    Off
                  </span>
                )}
              </Cell>
              <Cell className="font-mono text-[11px] text-muted-foreground">
                #{repository.installationId} · @{repository.installedBy}
              </Cell>
              <Cell className={cn("text-[12px]", repository.openIncidents > 0 ? "text-critical" : "text-muted-foreground")}>
                {repository.openIncidents > 0 ? `${repository.openIncidents} open` : "None"}
              </Cell>
              <Cell className="text-right text-[12px] text-muted-foreground">
                <time dateTime={repository.registeredAt} suppressHydrationWarning>
                  {timeAgo(repository.registeredAt)}
                </time>
              </Cell>
            </TableRow>
          );
        })}
      </TableScroller>
    </Card>
  );
}
