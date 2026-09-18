import { FlaskConical } from "lucide-react";

// A slim glass capsule above the page content rather than a full-width strip.
export function SimulationBanner() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-10 lg:pt-5">
      <div className="glass-control flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-3 py-2 text-[13px] sm:rounded-full">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-simulation/20 px-2 py-0.5 text-[11px] font-semibold text-simulation">
          <FlaskConical aria-hidden className="size-3" />
          Simulation mode
        </span>
        <p className="text-muted-foreground">
          Every incident here is simulated. No real credentials are validated, rotated or disabled.
        </p>
      </div>
    </div>
  );
}
