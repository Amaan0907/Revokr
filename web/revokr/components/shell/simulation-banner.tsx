// Pinned above every screen while simulation mode is on.
export function SimulationBanner() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[12px] border border-simulation/35 bg-simulation/10 px-3.5 py-[9px]">
      <span className="font-mono text-[10px] font-medium tracking-[.16em] text-simulation">SIMULATION MODE</span>
      <span className="text-[12px] text-muted-foreground">No real credentials are created, updated or disabled.</span>
    </div>
  );
}
