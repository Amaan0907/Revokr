"use client";

import { useEffect } from "react";

// One listener for the whole app: tells whichever glass panel is under the mouse where the pointer
// is, so its highlight (the .surface::after gradient) can follow it. Updates are batched to one
// per animation frame, and touch input is ignored.
export function GlassLight() {
  useEffect(() => {
    let frame = 0;
    let latest: PointerEvent | null = null;

    const apply = () => {
      frame = 0;
      const event = latest;
      if (!event || !(event.target instanceof Element)) return;
      const panel = event.target.closest<HTMLElement>(".surface");
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty("--glass-x", `${event.clientX - rect.left}px`);
      panel.style.setProperty("--glass-y", `${event.clientY - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      latest = event;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
