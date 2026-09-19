import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

// The landing page's button, after Animata's "work button": on hover a fill rises from the bottom
// edge until it covers the whole button, and the label changes to the opposite colour so it stays
// readable. A light button fills dark and a dark one fills light.
// Use it as the class on a <Link> or <button>, with <HoverButtonContent> as its only child.
//
// Each variant says which colour its label turns and which colour the fill is. The label's colour
// is transitioned on the button itself and inherited, so it changes in step with the rising fill.
const hoverButtonVariants = cva(
  "group relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/15 font-medium whitespace-nowrap outline-none select-none transition-[color,transform,translate,scale] duration-300 ease-out focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        // Light button, dark label: fills dark, label turns light.
        solid:
          "bg-primary text-primary-foreground hover:text-foreground focus-visible:text-foreground [&_[data-hover-fill]]:bg-background",
        // Dark button, light label: fills light, label turns dark.
        outline:
          "bg-white/[0.02] text-foreground hover:text-primary-foreground focus-visible:text-primary-foreground [&_[data-hover-fill]]:bg-primary",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-[15px]",
        hero: "h-13 px-7 text-[18px]",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "solid", size: "default" },
  },
);

function HoverButtonContent({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Three times the button's height and half as wide again, so its rounded top is a dome that
          sweeps up the button, and the button's own corners are covered once it arrives. */}
      <span
        aria-hidden
        data-hover-fill
        className="absolute -left-1/4 bottom-0 h-[300%] w-[150%] translate-y-full rounded-full transition-transform duration-300 ease-out group-hover:translate-y-1/2 group-focus-visible:translate-y-1/2 motion-reduce:transition-none"
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </>
  );
}

export { hoverButtonVariants, HoverButtonContent };
export type HoverButtonVariants = VariantProps<typeof hoverButtonVariants>;
