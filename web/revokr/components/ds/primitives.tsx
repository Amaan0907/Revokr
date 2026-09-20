import type { ComponentProps, CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The building blocks of every screen behind sign-in. Values here are the design file's, in px, so
// a screen built from them matches it exactly.

export function Card({
  as: Tag = "div",
  className,
  ...props
}: { as?: ElementType } & ComponentProps<"div">) {
  return <Tag className={cn("rounded-[18px] border border-white/8 bg-card", className)} {...props} />;
}

// The small uppercase mono label that sits above titles and inside cards.
export function Eyebrow({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

// The silver-gradient headline used at the top of every screen.
export function GradientHeading({
  as: Tag = "h1",
  className,
  ...props
}: { as?: ElementType } & ComponentProps<"h1">) {
  return (
    <Tag
      className={cn(
        "m-0 bg-linear-to-b from-white to-[#8e8e93] bg-clip-text font-medium leading-[normal] tracking-[-.03em] text-transparent",
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <GradientHeading className="text-[length:clamp(24px,3.2vw,32px)]">{title}</GradientHeading>
        {description && (
          <p className="m-0 max-w-[62ch] text-[13px] leading-[1.6] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

// A card's title row: a heading with an optional line of context underneath.
export function CardHeader({
  title,
  description,
  id,
  className,
}: {
  title: string;
  description?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h2 id={id} className="m-0 text-[14px] font-medium">
        {title}
      </h2>
      {description && <p className="m-0 text-[12px] leading-[1.55] text-muted-foreground">{description}</p>}
    </div>
  );
}

// One side of a two-column row. On desktop it fills the row's height and scrolls on its own, so a
// short column stays put beside a long one instead of scrolling away and leaving a blank gap. The
// content sits in an absolutely positioned layer, which keeps it out of the row's sizing: the row
// takes whatever height its parent gives it, and the content scrolls inside that. Below `lg` the
// columns just stack and the page scrolls. The layer reaches 4px past the column and pads it back
// in, so focus rings at the column's edge aren't clipped by the scroller.
export function ScrollPane({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="lg:relative">
      <div className={cn("lg:absolute lg:-inset-1 lg:overflow-y-auto lg:p-1", className)}>{children}</div>
    </div>
  );
}

const BUTTON_VARIANT = {
  primary: "border-transparent bg-[#f5f5f7] text-black hover:bg-white",
  secondary: "border-white/12 bg-white/6 text-[#f5f5f7] hover:bg-white/10",
  danger: "border-[#b8625c]/35 bg-[#b8625c]/12 text-[#b8625c] hover:bg-[#b8625c]/20",
} as const;

// Padding is the design's, less the 1px border every variant carries so all three are the same size.
const BUTTON_SIZE = {
  sm: "px-3.5 py-[7px] text-[12px]",
  md: "px-[15px] py-2 text-[13px]",
  lg: "px-[17px] py-[9px] text-[13px]",
} as const;

export interface ButtonStyle {
  variant?: keyof typeof BUTTON_VARIANT;
  size?: keyof typeof BUTTON_SIZE;
  className?: string;
}

// Class names for a pill button, so a link can look like one too.
export function btn({ variant = "secondary", size = "md", className }: ButtonStyle = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    BUTTON_VARIANT[variant],
    BUTTON_SIZE[size],
    className,
  );
}

export function Btn({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & ButtonStyle) {
  return <button type={type} className={btn({ variant, size, className })} {...props} />;
}

// A rounded, quiet pill: the shell of search fields and filters.
export const PILL =
  "flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-[13px] py-[7px]";

// A tone-coloured dot, drawn in the text colour of whatever it sits in.
export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full bg-current", className)} />;
}

const MONO_STATUS = "font-mono text-[10px] font-medium uppercase tracking-[.1em]";

// A status, result or flag as tone-coloured mono text, the way tables show them.
export function MonoStatus({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(MONO_STATUS, className)} {...props} />;
}

// A status as an outlined chip with a dot, the way the incident header shows it.
export function StatusChip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] rounded-full border border-white/14 px-[11px] py-[5px] font-mono text-[10px] font-medium uppercase tracking-[.12em]",
        className,
      )}
    >
      <Dot />
      {children}
    </span>
  );
}

// Grid tables: a header row and body rows sharing one column template, inside a scroller so narrow
// screens scroll sideways instead of squashing the columns.
export function TableScroller({ minWidth, label, children }: { minWidth: number; label: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label={label} style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

// A column heading: plain text, or text with something else in its place (a sort button).
type Column = string | { label: string; align?: "right"; node?: ReactNode };

export function TableHead({ columns, labels }: { columns: string; labels: Column[] }) {
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: columns }}
      className="grid gap-3 border-b border-white/8 px-[18px] py-2.5 font-mono text-[10px] font-medium uppercase tracking-[.12em] text-muted-foreground"
    >
      {labels.map((column, i) => {
        const { label, align, node } =
          typeof column === "string" ? { label: column, align: undefined, node: undefined } : column;
        return (
          <span key={`${label}-${i}`} role="columnheader" className={align === "right" ? "text-right" : undefined}>
            {node ?? label}
          </span>
        );
      })}
    </div>
  );
}

export function TableRow({
  columns,
  className,
  children,
  ...props
}: { columns: string } & ComponentProps<"div">) {
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: columns }}
      className={cn("grid items-center gap-3 border-b border-white/6 px-[18px] py-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Cell({ className, ...props }: ComponentProps<"span">) {
  return <span role="cell" className={cn("min-w-0", className)} {...props} />;
}

// A status that is the cell itself. Wrapping a 10px status in a default-size cell would seat it on
// a taller line box and make every row a couple of pixels too tall.
export function StatusCell({ className, ...props }: ComponentProps<"span">) {
  return <Cell className={cn(MONO_STATUS, className)} {...props} />;
}

// A placeholder block while data loads: a dim bar that fades in and out.
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn("animate-[ds-shimmer_1.6s_infinite] rounded-[6px] bg-white/8", className)}
    />
  );
}
