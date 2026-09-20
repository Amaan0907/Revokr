import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

// Small on purpose: a mono label above a heading that reads at a glance.
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-xl", align === "center" && "mx-auto text-center", className)}>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 text-[length:clamp(1.375rem,2.4vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-silver text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
      )}
    </Reveal>
  );
}
