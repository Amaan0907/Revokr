"use client";

import { useState, useTransition } from "react";
import { Card, Eyebrow } from "@/components/ds/primitives";
import { Switch } from "@/components/ds/switch";
import { setSimulationMode } from "@/app/(dashboard)/settings/actions";

export function SimulationCard({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (next: boolean) => {
    setEnabled(next);
    setFailed(false);
    startTransition(async () => {
      try {
        await setSimulationMode(next);
      } catch {
        setEnabled(!next);
        setFailed(true);
      }
    });
  };

  return (
    <Card as="section" aria-labelledby="simulation-heading" className="flex flex-col gap-3.5 p-5">
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex min-w-[220px] flex-1 flex-col gap-[5px]">
          <h2 id="simulation-heading" className="m-0 text-[14px] font-medium">
            Simulation mode
          </h2>
          <span className="text-[12px] leading-[1.55] text-muted-foreground">
            Runs the whole loop with fake credentials so you can demo or test it.{" "}
            {enabled ? "On — every step is labelled SIMULATED" : "Off — actions affect real credentials"}
          </span>
        </div>
        <Switch
          size="lg"
          checked={enabled}
          onCheckedChange={toggle}
          disabled={pending}
          aria-labelledby="simulation-heading"
        />
      </div>

      <div className="flex flex-col gap-1 rounded-[12px] border border-simulation/30 bg-simulation/8 px-3.5 py-3">
        <Eyebrow className="tracking-[.16em] text-simulation">SIMULATION MODE</Eyebrow>
        <span className="text-[12px] leading-[1.5] text-muted-foreground">
          When on, this banner is pinned app-wide and every action row, audit entry and timeline step is
          labelled SIMULATED. No provider API is called with write scope.
        </span>
      </div>

      {failed && (
        <p role="alert" className="m-0 text-[12px] text-failed">
          Couldn&apos;t save that change. Your session may have ended. Try again.
        </p>
      )}
    </Card>
  );
}
