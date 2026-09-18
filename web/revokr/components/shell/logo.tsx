import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

// The app icon: a white squircle with a key, lit from above like a physical key cap.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-[28%] bg-linear-to-b from-white to-[#c7c7cc] text-black",
        "shadow-[inset_0_-1px_0_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.9),0_1px_3px_rgb(0_0_0/0.6)]",
        className,
      )}
    >
      <KeyRound className="size-[56%]" strokeWidth={2.4} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.022em]">Revokr</span>
    </span>
  );
}
