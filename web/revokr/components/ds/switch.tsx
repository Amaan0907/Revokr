"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

const SIZE = {
  // Repository rows.
  md: { root: "h-5 w-[34px]", thumb: "size-4 data-[checked]:left-4" },
  // Settings.
  lg: { root: "h-[22px] w-[38px]", thumb: "size-[18px] data-[checked]:left-[18px]" },
} as const;

// A light track with a dark knob when on; a dim track with a grey knob when off.
export function Switch({
  size = "md",
  className,
  ...props
}: SwitchPrimitive.Root.Props & { size?: keyof typeof SIZE }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative block shrink-0 cursor-pointer rounded-full border border-white/14 bg-white/12 p-0 transition-colors data-[checked]:bg-[#f5f5f7] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        SIZE[size].root,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "absolute left-0.5 top-px rounded-full bg-[#86868b] transition-[left] duration-150 data-[checked]:bg-black",
          SIZE[size].thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );
}
