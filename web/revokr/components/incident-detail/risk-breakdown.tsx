import { Card } from "@/components/ds/primitives";
import type { Incident } from "@/lib/types";

// The score is a sum of factors, and the factors are always shown with the number.
export function RiskBreakdown({ incident }: { incident: Incident }) {
  const factors = [...incident.riskFactors].sort((a, b) => b.points - a.points);

  return (
    <Card as="section" aria-labelledby="risk-heading" className="flex flex-col gap-2.5 p-5">
      <h2 id="risk-heading" className="m-0 text-[14px] font-medium">
        Risk {incident.riskScore} · {incident.severity}
      </h2>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {factors.map((factor) => (
          <li
            key={factor.factor}
            className="flex items-baseline justify-between gap-2.5 border-b border-white/6 pb-[7px]"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[12px] leading-[1.5] text-muted-foreground">{factor.factor}</span>
              {factor.detail && (
                <span className="text-[11px] leading-[1.5] text-muted-foreground/70">{factor.detail}</span>
              )}
            </span>
            <span className="font-mono text-[11px] font-medium">+{factor.points}</span>
          </li>
        ))}
      </ul>

      <span className="text-[11px] leading-[1.6] text-muted-foreground">
        Deterministic: same inputs, same score. Factors are always shown with the number.
      </span>
    </Card>
  );
}
