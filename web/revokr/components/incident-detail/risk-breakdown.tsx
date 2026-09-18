import { SEVERITY_META } from "@/lib/incident-meta";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

// Largest factor is drawn most solid; each smaller one a little fainter.
const SHADES = ["opacity-100", "opacity-75", "opacity-55", "opacity-40", "opacity-30", "opacity-20"];

export function RiskBreakdown({ incident }: { incident: Incident }) {
  const tone = SEVERITY_META[incident.severity].text;
  const factors = [...incident.riskFactors].sort((a, b) => b.points - a.points);

  return (
    <section aria-labelledby="risk-heading" className="rounded-xl border bg-card p-5">
      <h2 id="risk-heading" className="text-sm font-semibold">
        Why it scored {incident.riskScore}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        The risk score is the sum of these factors, out of 100.
      </p>

      <div aria-hidden className={cn("mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted", tone)}>
        {factors.map((factor, i) => (
          <span
            key={factor.factor}
            className={cn("h-full origin-left animate-grow-x bg-current", SHADES[i % SHADES.length])}
            style={{ width: `${factor.points}%`, animationDelay: `${200 + i * 90}ms` }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {factors.map((factor, i) => (
          <li key={factor.factor} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn("mt-1.5 size-2 shrink-0 rounded-sm bg-current", tone, SHADES[i % SHADES.length])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{factor.factor}</p>
              {factor.detail && (
                <p className="mt-0.5 text-xs break-words text-muted-foreground">{factor.detail}</p>
              )}
            </div>
            <span className="text-sm font-medium tabular-nums">+{factor.points}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
