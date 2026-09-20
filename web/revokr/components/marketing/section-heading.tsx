import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

// Small on purpose: a mono label above a heading that reads at a glance. `lg` is for a section that
// has the left half of the screen to itself, beside a large visual.
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  size = "default",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  size?: "default" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <Reveal className={cn(lg ? "max-w-2xl" : "max-w-xl", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "font-mono uppercase tracking-[0.08em] text-muted-foreground",
          lg ? "text-[13px]" : "text-[11px]",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-semibold leading-[1.15] tracking-[-0.035em] text-silver text-balance",
          lg ? "text-[length:clamp(1.75rem,3.4vw,2.6rem)]" : "text-[length:clamp(1.375rem,2.4vw,1.75rem)]",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "leading-relaxed text-muted-foreground text-pretty",
            lg ? "mt-4 text-[18px]" : "mt-3 text-[15px]",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
