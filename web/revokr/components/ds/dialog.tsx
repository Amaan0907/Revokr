"use client";

import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;

// A centred modal over a dimmed, blurred backdrop. Focus is trapped and Escape closes it.
export function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-60 bg-black/72 backdrop-blur-[6px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          "ds-root fixed left-1/2 top-1/2 z-60 flex max-h-[88vh] w-[min(520px,calc(100vw-36px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3.5 overflow-auto rounded-[22px] border border-white/12 bg-card p-6 tracking-normal outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-[.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("m-0 text-xl font-medium tracking-[-.02em] text-[#f5f5f7]", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("m-0 text-[13px] leading-[1.6] text-muted-foreground", className)}
      {...props}
    />
  );
}
