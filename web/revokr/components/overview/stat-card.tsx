import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  detail: ReactNode;
  icon: LucideIcon;
  index: number;
  highlight?: boolean;
}

export function StatCard({ label, value, detail, icon: Icon, index, highlight }: StatCardProps) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        highlight && "border-approval/40 bg-approval/5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent",
          highlight ? "via-approval/70" : "via-white/10",
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <Icon aria-hidden className={cn("size-4", highlight ? "text-approval" : "text-muted-foreground")} />
      </div>
      <dd className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dd className="mt-1 text-xs text-muted-foreground">{detail}</dd>
    </div>
  );
}
