import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="text-[17px] font-semibold tracking-[-0.01em] text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 text-[length:clamp(2.25rem,5.5vw,4rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-[length:clamp(1.0625rem,1.8vw,1.25rem)] leading-relaxed tracking-[-0.012em] text-muted-foreground text-pretty">
          {description}
        </p>
      )}
    </Reveal>
  );
}
