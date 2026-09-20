import Link from "next/link";
import { Check, Plus, TriangleAlert } from "lucide-react";
import { GITHUB_APP_INSTALL_URL } from "@/lib/github-app";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD =
  "flex min-h-[104px] rounded-[18px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40";

// The overview's project list: a card per connected repository, and a dashed card that opens the
// GitHub App installation page so another repository can be connected.
export function Projects({ projects }: { projects: Project[] }) {
  return (
    <section aria-labelledby="projects-heading" className="flex flex-col gap-3">
      <h2 id="projects-heading" className="m-0 text-[16px] font-medium">
        Projects
      </h2>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
        {projects.map((project) => {
          const clear = project.openIncidents === 0;
          return (
            <Link
              key={project.id}
              href={project.href}
              className={cn(
                CARD,
                "flex-col justify-between gap-4 border border-white/8 bg-card p-[18px] hover:border-white/20",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[14px] font-medium">{project.name}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{project.owner}</span>
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-[12px]",
                  clear ? "bg-resolved/10 text-resolved" : "bg-critical/10 text-critical",
                )}
              >
                {clear ? <Check aria-hidden className="size-3.5" /> : <TriangleAlert aria-hidden className="size-3.5" />}
                {clear
                  ? "No open incidents"
                  : `${project.openIncidents} open ${project.openIncidents === 1 ? "incident" : "incidents"}`}
              </span>
            </Link>
          );
        })}

        <a
          href={GITHUB_APP_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(
            CARD,
            "items-center justify-center gap-2 border border-dashed border-white/15 text-[13px] text-muted-foreground hover:border-white/30 hover:text-[#f5f5f7]",
          )}
        >
          <Plus aria-hidden className="size-4" />
          Create new project
          <span className="sr-only">(opens GitHub to install the app on another repository)</span>
        </a>
      </div>
    </section>
  );
}
