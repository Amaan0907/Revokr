import { FlaskConical } from "lucide-react";

export function SimulationBanner() {
  return (
    <div className="border-b border-simulation/25 bg-simulation/5 bg-hazard">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-simulation px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-background">
          <FlaskConical aria-hidden className="size-3" />
          Simulation mode
        </span>
        <p className="text-simulation">
          Every incident here is simulated. No real credentials are validated, rotated or disabled.
        </p>
      </div>
    </div>
  );
}
