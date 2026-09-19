import type { ReactNode } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ds/primitives";
import { cn } from "@/lib/utils";

const TONE = {
  critical: "text-critical",
  approval: "text-approval",
  progress: "text-progress",
  resolved: "text-resolved",
} as const;

interface StatCardProps {
  label: string;
  value: number | string;
  detail: ReactNode;
  tone: keyof typeof TONE;
  href: string;
}

// One number, what it counts, and a line of context. The whole card opens the matching list.
export function StatCard({ label, value, detail, tone, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-[18px] border border-white/8 bg-card p-[18px] transition-colors hover:border-white/16"
    >
      <Eyebrow className={cn("tracking-[.12em]", TONE[tone])}>{label}</Eyebrow>
      <span className="text-[26px] leading-[1.15] tracking-[-.02em] tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{detail}</span>
    </Link>
  );
}
