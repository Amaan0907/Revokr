import Link from "next/link";
import { ArrowRight, Hourglass, ShieldCheck } from "lucide-react";
import { IconTile } from "@/components/shell/icon-tile";
import { buttonVariants } from "@/components/ui/button";
import type { Incident } from "@/lib/types";

// The one thing to do next, at the top of the overview: approve waiting rotations, or relax.
export function FocusBanner({ awaiting }: { awaiting: Incident[] }) {
  const top = [...awaiting].sort((a, b) => b.riskScore - a.riskScore)[0];

  if (!top) {
    return (
      <section className="surface relative overflow-hidden rounded-3xl p-6 animate-in fade-in animation-duration-700 fill-mode-both sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgb(255_255_255/0.05),transparent_60%)]"
        />
        <div className="relative flex items-center gap-4">
          <IconTile icon={ShieldCheck} color="green" size="lg" />
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.02em]">You&apos;re all caught up</h2>
            <p className="mt-0.5 text-[15px] text-muted-foreground">
              No rotations are waiting on you. Revokr is handling every open incident on its own.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const count = awaiting.length;
  return (
    <section
      aria-labelledby="focus-heading"
      className="surface relative overflow-hidden rounded-3xl p-6 animate-in fade-in animation-duration-700 fill-mode-both sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgb(255_255_255/0.05),transparent_60%)]"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <IconTile icon={Hourglass} color="yellow" size="lg" />
        <div className="min-w-0 flex-1">
          <h2 id="focus-heading" className="text-[17px] font-semibold tracking-[-0.02em] text-balance">
            {count === 1 ? "A rotation is waiting for your approval" : `${count} rotations are waiting for your approval`}
          </h2>
          <p className="mt-0.5 text-[15px] text-muted-foreground">
            {count === 1 ? "It's" : "Riskiest first:"} a live {top.secretType} in{" "}
            <span className="text-foreground">
              {top.repositoryOwner}/{top.repositoryName}
            </span>
            , risk <span className="tabular-nums text-foreground">{top.riskScore}</span>. The
            replacement is ready.
          </p>
        </div>
        <Link href={`/incidents/${top.id}`} className={buttonVariants({ size: "lg" })}>
          Review now
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}
