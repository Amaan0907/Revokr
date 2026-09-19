import Link from "next/link";
import { btn, Card } from "@/components/ds/primitives";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

// The one thing to do next, at the top of the overview: approve waiting rotations, or relax.
export function FocusBanner({ awaiting }: { awaiting: Incident[] }) {
  const top = [...awaiting].sort((a, b) => b.riskScore - a.riskScore)[0];
  const count = awaiting.length;

  return (
    <Card as="section" aria-label="What to do next" className="flex flex-wrap items-center gap-4 p-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span aria-hidden className={cn("size-[7px] rounded-full", top ? "bg-approval" : "bg-resolved")} />
          <span className="text-[14px] font-medium">
            {!top
              ? "You're all caught up"
              : count === 1
                ? "A rotation is waiting for your approval"
                : `${count} rotations are waiting for your approval`}
          </span>
        </div>
        <span className="text-[12px] leading-[1.6] text-muted-foreground">
          {top ? (
            <>
              {count === 1 ? "It's" : "Riskiest first:"} a live {top.secretType} in{" "}
              <span className="font-mono text-[#f5f5f7]">
                {top.repositoryOwner}/{top.repositoryName}
              </span>
              , risk <span className="font-mono text-[#f5f5f7]">{top.riskScore}</span>. The replacement is ready.
            </>
          ) : (
            "No rotations are waiting on you. Revokr is handling every open incident on its own."
          )}
        </span>
      </div>
      {top && (
        <Link href={`/incidents/${top.id}`} className={btn({ variant: "primary" })}>
          Review now
        </Link>
      )}
    </Card>
  );
}
