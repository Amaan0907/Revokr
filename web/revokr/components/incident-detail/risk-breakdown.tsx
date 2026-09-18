import { WipeIn } from "@/components/motion/wipe-in";
import { SEVERITY_META } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

// Largest factor is drawn most solid; each smaller one a little fainter.
const SHADES = ["opacity-100", "opacity-75", "opacity-55", "opacity-40", "opacity-30", "opacity-20"];

export function RiskBreakdown({ incident }: { incident: Incident }) {
  const tone = SEVERITY_META[incident.severity].text;
  const factors = [...incident.riskFactors].sort((a, b) => b.points - a.points);

  return (
    <section
      aria-labelledby="risk-heading"
      className="surface rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both [animation-delay:220ms]"
    >
      <h2 id="risk-heading" className="text-[17px] font-semibold tracking-[-0.015em]">
        Why it scored <span className={cn("tabular-nums", tone)}>{incident.riskScore}</span>
      </h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        The risk score is the sum of these factors, out of 100.
      </p>

      <div aria-hidden className="mt-5 h-2.5 rounded-full bg-white/[0.06]">
        <WipeIn className={cn("flex h-full gap-[3px]", tone)} delay={0.2}>
          {factors.map((factor, i) => (
            <span
              key={factor.factor}
              className={cn("h-full rounded-full bg-current", SHADES[i % SHADES.length])}
              style={{ width: `${factor.points}%` }}
            />
          ))}
        </WipeIn>
      </div>

      <ul className="mt-5 flex flex-col divide-y divide-white/[0.06]">
        {factors.map((factor, i) => (
          <li key={factor.factor} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className={cn("mt-1.5 size-2 shrink-0 rounded-full bg-current", tone, SHADES[i % SHADES.length])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{factor.factor}</p>
              {factor.detail && (
                <p className="mt-0.5 text-xs break-words text-muted-foreground">{factor.detail}</p>
              )}
            </div>
            <span className={cn("text-sm font-semibold tabular-nums", tone)}>+{factor.points}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
