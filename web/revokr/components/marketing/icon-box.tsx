import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A thin outlined icon in a hairline square, the marketing pages' quiet alternative to the
// filled tiles used inside the app.
export function IconBox({
  icon: Icon,
  size = "default",
  className,
}: {
  icon: LucideIcon;
  size?: "default" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center border border-white/10 bg-white/[0.03] text-foreground/80",
        lg ? "size-11 rounded-lg" : "size-8 rounded-md",
        className,
      )}
    >
      <Icon className={lg ? "size-5" : "size-4"} strokeWidth={1.75} />
    </span>
  );
}
