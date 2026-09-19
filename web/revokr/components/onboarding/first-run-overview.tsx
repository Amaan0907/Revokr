import Link from "next/link";
import { btn, Card, Eyebrow } from "@/components/ds/primitives";
import type { GitHubInstallation } from "@/lib/types";
import { SetupChecklist } from "./setup-checklist";

function EmptyStat({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-dashed border-white/14 p-4">
      <Eyebrow className="tracking-[.12em]">{label}</Eyebrow>
      <span className="text-[26px] text-muted-foreground">—</span>
      <span className="text-[11px] text-muted-foreground">{detail}</span>
    </div>
  );
}

// What the overview shows before there is anything to summarise: the setup checklist instead of a
// wall of empty stat cards.
export function FirstRunOverview({ installation }: { installation: GitHubInstallation | null }) {
  return (
    <>
      <Card className="flex flex-col gap-3.5 p-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
          <EmptyStat label="Open incidents" detail="Nothing detected yet" />
          <EmptyStat label="Awaiting approval" detail="Nothing to approve" />
          <div className="flex flex-col gap-2 rounded-[14px] border border-white/10 bg-white/3 p-4">
            <span className="text-[12px] font-medium">Turn on your first repository</span>
            <span className="text-[11px] leading-[1.5] text-muted-foreground">
              {installation ? "Step 2 of 3 — takes about a minute." : "Step 1 of 3 — takes about a minute."}
            </span>
            <Link href="/repositories" className={btn({ variant: "primary", size: "sm", className: "self-start" })}>
              Choose repositories
            </Link>
          </div>
        </div>
      </Card>
      <SetupChecklist installation={installation} monitored={0} />
    </>
  );
}
