import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// macOS System Settings-style icon: a white glyph on a squircle, lit from the top. Grey by default;
// the other tones are muted and only mark a status (needs approval, failed, resolved).
const TILE = {
  gray: "from-[#8e8e93] to-[#5b5b60]",
  red: "from-[#b96d67] to-[#8a4641]",
  orange: "from-[#b98c62] to-[#8a6238]",
  yellow: "from-[#b3a36a] to-[#867843]",
  green: "from-[#7ea38a] to-[#537a60]",
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
