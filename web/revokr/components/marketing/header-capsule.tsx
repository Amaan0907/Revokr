"use client";

import { useState, type ReactNode } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";

// The floating nav capsule: roomy and nearly clear at the top of the page, then it draws in and
// frosts over a little once content starts sliding underneath it.
export function HeaderCapsule({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 24;
    if (next !== scrolled) setScrolled(next);
  });

  return (
    <div
      data-scrolled={scrolled}
      className={cn(
        "glass-rim relative mx-auto flex h-14 items-center justify-between gap-6 rounded-full pl-5 pr-2.5 backdrop-blur-3xl backdrop-saturate-[1.8]",
        "transition-[max-width,background-color,box-shadow] duration-700 ease-out-expo",
        scrolled
          ? "max-w-4xl bg-black/55 shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_16px_48px_-12px_rgb(0_0_0/0.9)]"
          : "max-w-5xl bg-black/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_8px_30px_-12px_rgb(0_0_0/0.6)]",
      )}
    >
      {children}
    </div>
  );
}
