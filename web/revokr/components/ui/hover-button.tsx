import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

// The "interactive hover" pill: a small dot sits beside the label, and on hover it swells to fill
// the whole button while the label slides out and a second copy, with an arrow, slides in.
// Use it as the class on a <Link> or <button>, with <HoverButtonContent> as its only child.
//
// The dot is drawn in the text colour (bg-current) and the sliding-in copy in its inverse, so each
// variant only needs to say which is which.
const hoverButtonVariants = cva(
  "group relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/15 font-medium whitespace-nowrap outline-none select-none transition-transform duration-200 ease-out focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        // Light pill, dark dot: floods dark on hover.
        solid: "bg-primary text-primary-foreground [&_[data-hover-ink]]:text-foreground",
        // Dark pill, light dot: floods light on hover.
        outline: "bg-white/[0.02] text-foreground [&_[data-hover-ink]]:text-primary-foreground",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-[15px]",
        hero: "h-13 px-7 text-[18px]",
      },
    },
    defaultVariants: { variant: "solid", size: "default" },
  },
);

const SWAP = "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none";

function HoverButtonContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-[0.55em] rounded-full bg-current transition-transform duration-300 ease-out group-hover:scale-[100] group-focus-visible:scale-[100] motion-reduce:transition-none"
        />
        <span className={`${SWAP} inline-flex items-center gap-2 group-hover:translate-x-8 group-hover:opacity-0 group-focus-visible:translate-x-8 group-focus-visible:opacity-0`}>
          {children}
        </span>
      </span>
      <span
        aria-hidden
        data-hover-ink
        className={`${SWAP} absolute inset-0 z-10 flex translate-x-8 items-center justify-center gap-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100`}
      >
        <span className="inline-flex items-center gap-2">{children}</span>
        <ArrowRight className="size-[1.2em] shrink-0" />
      </span>
    </>
  );
}

export { hoverButtonVariants, HoverButtonContent };
export type HoverButtonVariants = VariantProps<typeof hoverButtonVariants>;
