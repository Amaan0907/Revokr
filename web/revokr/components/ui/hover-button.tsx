import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

// The landing page's button, after Animata's "slide arrow button": at rest, a circle holding an
// arrow sits at the left end. On hover the circle stretches across the whole button, the arrow
// rides along to the right end and the label slides left and changes colour to stay readable. A
// light button has a dark circle and a dark one has a light circle.
// Use it as the class on a <Link> or <button>, with <HoverButtonContent> as its only child.
//
// --arrow is the button's height, which is also the circle's diameter and how far the label is
// pushed right to clear it. Each variant says the label's colour after hover and the circle's
// colours. The label's colour is transitioned on the button itself and inherited, so it changes in
// step with the stretching circle. The border takes the fill's colour on hover, so it disappears
// into it without the button changing size (the fill can't paint over the border itself).
const hoverButtonVariants = cva(
  "group relative inline-flex shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-white/15 font-medium whitespace-nowrap outline-none select-none transition-[color,border-color,transform,translate,scale] duration-200 ease-in-out focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        // Light button, dark label: dark circle, and the label turns light as it fills.
        solid:
          "bg-primary text-primary-foreground hover:border-background hover:text-foreground focus-visible:border-background focus-visible:text-foreground [&_[data-slide-bar]]:bg-background [&_[data-slide-bar]]:text-foreground",
        // Dark button, light label: light circle, and the label turns dark as it fills.
        outline:
          "bg-white/[0.02] text-foreground hover:border-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:text-primary-foreground [&_[data-slide-bar]]:bg-primary [&_[data-slide-bar]]:text-primary-foreground",
      },
      size: {
        sm: "h-8 pr-3.5 pl-[calc(var(--arrow)+0.5rem)] text-[13px] [--arrow:calc(var(--spacing)*8)]",
        default: "h-9 pr-4 pl-[calc(var(--arrow)+0.5rem)] text-sm [--arrow:calc(var(--spacing)*9)]",
        lg: "h-11 pr-5 pl-[calc(var(--arrow)+0.625rem)] text-[15px] [--arrow:calc(var(--spacing)*11)]",
        hero: "h-13 pr-7 pl-[calc(var(--arrow)+0.75rem)] text-[18px] [--arrow:calc(var(--spacing)*13)]",
      },
    },
    defaultVariants: { variant: "solid", size: "default" },
  },
);

function HoverButtonContent({ children }: { children: ReactNode }) {
  return (
    <>
      {/* The circle is the button's height less its 1px border, so it starts as a true circle. */}
      <span
        aria-hidden
        data-slide-bar
        className="absolute inset-y-0 left-0 flex w-[calc(var(--arrow)-2px)] items-center justify-end rounded-full transition-[width] duration-200 ease-in-out group-hover:w-full group-focus-visible:w-full motion-reduce:transition-none"
      >
        <ArrowRight className="mr-[calc((var(--arrow)-1.1em)/2-1px)] size-[1.1em] shrink-0" />
      </span>
      <span className="relative z-10 inline-flex items-center gap-2 transition-transform duration-200 ease-in-out group-hover:-translate-x-[calc(var(--arrow)/2)] group-focus-visible:-translate-x-[calc(var(--arrow)/2)] motion-reduce:transition-none">
        {children}
      </span>
    </>
  );
}

export { hoverButtonVariants, HoverButtonContent };
export type HoverButtonVariants = VariantProps<typeof hoverButtonVariants>;
