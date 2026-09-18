import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

const TONE = {
  critical: "text-critical",
  approval: "text-approval",
  progress: "text-progress",
  resolved: "text-resolved",
} as const;

interface StatCardProps {
  label: string;
  // Numbers count up on first view; preformatted strings (like a duration) render as they are.
  value: number | string;
  unit?: string;
  detail: ReactNode;
  icon: LucideIcon;
  tone: keyof typeof TONE;
  href: string;
  index: number;
  pulse?: boolean;
}

// A Health app-style summary card: coloured label, one big number, a line of context.
export function StatCard({ label, value, unit, detail, icon: Icon, tone, href, index, pulse }: StatCardProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        "surface group relative flex flex-col rounded-3xl p-5 transition-[background-color,transform] duration-300 hover:bg-white/[0.07] active:scale-[0.985]",
        "animate-in fade-in slide-in-from-bottom-3 animation-duration-700 fill-mode-both",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("flex items-center gap-1.5 text-[13px] font-semibold", TONE[tone])}>
          <Icon aria-hidden className="size-4" />
          {label}
          {pulse && (
            <span aria-hidden className="relative ml-0.5 flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-current" />
              <span className="relative size-1.5 rounded-full bg-current" />
            </span>
          )}
        </p>
        <ChevronRight
          aria-hidden
          className="size-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        />
      </div>
      <p className="mt-7 flex items-baseline gap-1.5">
        <span className="text-[40px] font-semibold leading-none tracking-[-0.045em] tabular-nums">
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </span>
        {unit && <span className="text-[15px] font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-2 text-[13px] text-muted-foreground">{detail}</p>
    </Link>
  );
}
