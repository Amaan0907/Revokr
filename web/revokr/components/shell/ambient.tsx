import { cn } from "@/lib/utils";

const ORB = "absolute rounded-full";

// Soft pools of coloured light fixed behind the page, like an Apple wallpaper under Liquid Glass.
// Mostly black; just enough colour for the translucent panels above to pick up. Drifting is
// opt-in and kept to pages with little else moving.
export function Ambient({ animated = false, className }: { animated?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div
        className={cn(
          ORB,
          "-left-[18vmax] -top-[24vmax] size-[72vmax] bg-[radial-gradient(closest-side,rgb(10_132_255/0.30),transparent)]",
          animated && "animate-drift-a will-change-transform",
        )}
      />
      <div
        className={cn(
          ORB,
          "-right-[22vmax] top-[8vh] size-[66vmax] bg-[radial-gradient(closest-side,rgb(191_90_242/0.22),transparent)]",
          animated && "animate-drift-b will-change-transform",
        )}
      />
      <div
        className={cn(
          ORB,
          "-bottom-[34vmax] left-[18vw] size-[62vmax] bg-[radial-gradient(closest-side,rgb(100_210_255/0.14),transparent)]",
          animated && "animate-drift-c will-change-transform",
        )}
      />
      <div
        className={cn(
          ORB,
          "-bottom-[20vmax] -right-[10vmax] size-[40vmax] bg-[radial-gradient(closest-side,rgb(255_55_95/0.10),transparent)]",
          animated && "animate-drift-a will-change-transform [animation-delay:-13s]",
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_50%_0%,transparent_35%,rgb(0_0_0/0.7)_100%)]" />
    </div>
  );
}
