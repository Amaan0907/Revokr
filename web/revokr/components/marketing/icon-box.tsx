import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A thin outlined icon in a hairline square, the marketing pages' quiet alternative to the
// filled tiles used inside the app.
export function IconBox({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.03] text-foreground/80",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
}
