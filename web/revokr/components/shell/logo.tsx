import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-primary to-progress shadow-lg shadow-primary/30">
        <KeyRound aria-hidden className="size-4 text-primary-foreground" strokeWidth={2.25} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Revokr</span>
    </span>
  );
}
