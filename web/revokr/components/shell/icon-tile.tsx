import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// macOS System Settings-style icon: a white glyph on a coloured squircle, lit from the top.
const TILE = {
  blue: "from-[#4ba3ff] to-[#0a6cff]",
  red: "from-[#ff6b61] to-[#e5261b]",
  orange: "from-[#ffb340] to-[#f58300]",
  yellow: "from-[#ffe14d] to-[#f5b800]",
  green: "from-[#5ae07c] to-[#1fb141]",
  teal: "from-[#7fdcff] to-[#1aa8e0]",
  purple: "from-[#d584ff] to-[#9a3ad6]",
  indigo: "from-[#8a88ff] to-[#4b49d6]",
  gray: "from-[#8e8e93] to-[#5b5b60]",
} as const;

export type TileColor = keyof typeof TILE;

const SIZE = {
  sm: "size-6 rounded-[7px] [&_svg]:size-3.5",
  md: "size-8 rounded-[9px] [&_svg]:size-[18px]",
  lg: "size-11 rounded-[12px] [&_svg]:size-6",
} as const;

export function IconTile({
  icon: Icon,
  color,
  size = "sm",
  className,
}: {
  icon: LucideIcon;
  color: TileColor;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-linear-to-b text-white",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(0_0_0/0.4)]",
        TILE[color],
        SIZE[size],
        className,
      )}
    >
      <Icon strokeWidth={2.2} />
    </span>
  );
}
