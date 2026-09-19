import type { ReactNode } from "react";
import { Card, Eyebrow, GradientHeading } from "@/components/ds/primitives";
import { cn } from "@/lib/utils";

const TONE = {
  approval: "text-approval",
  failed: "text-failed",
  attention: "text-attention",
  unsupported: "text-unsupported",
  resolved: "text-resolved",
  progress: "text-progress",
  muted: "text-muted-foreground",
} as const;

export type StateTone = keyof typeof TONE;

interface StateCardProps {
  eyebrow: string;
  title?: string;
  tone?: StateTone;
  // "compact" sits in a grid of states; "page" replaces a whole screen's content.
  size?: "compact" | "page";
  // Page-size titles can wear the silver gradient, like a screen headline.
  gradientTitle?: boolean;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// The one shape every page uses to say something isn't as expected: a toned label, what happened,
// what it means for the person, and the next step. Nothing here blames the reader.
export function StateCard({
  eyebrow,
  title,
  tone = "muted",
  size = "compact",
  gradientTitle = false,
  children,
  actions,
  className,
}: StateCardProps) {
  const page = size === "page";
  return (
    <Card
      as="section"
      className={cn(
        "flex flex-col items-start",
        page ? "max-w-[600px] gap-3.5 rounded-[20px] p-8" : "gap-2.5 p-5",
        className,
      )}
    >
      <Eyebrow className={cn(page ? "tracking-[.16em]" : "tracking-[.14em]", TONE[tone])}>{eyebrow}</Eyebrow>
      {title &&
        (gradientTitle ? (
          <GradientHeading as="h2" className="text-[22px]">
            {title}
          </GradientHeading>
        ) : (
          <h2 className={cn("m-0 font-medium", page ? "text-xl tracking-[-.02em]" : "text-[15px]")}>{title}</h2>
        ))}
      {children && (
        <div className={cn("text-muted-foreground", page ? "text-[13px] leading-[1.6]" : "text-[12px] leading-[1.6]")}>
          {children}
        </div>
      )}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </Card>
  );
}
