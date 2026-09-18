"use client";

import { useEffect } from "react";

// How much of the remaining distance the page covers each 60fps frame. Lower feels floatier,
// higher feels more direct. 0.14 stays smooth without feeling like the page lags your hand.
const LERP = 0.14;
const LINE_HEIGHT = 16;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// True when the wheel should scroll a nested element (a list, a code block) rather than the page.
function nestedCanScroll(start: EventTarget | null, deltaY: number): boolean {
  let node = start instanceof Element ? start : null;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.scrollHeight > node.clientHeight) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") {
        const atTop = node.scrollTop <= 0;
        const atBottom = Math.ceil(node.scrollTop + node.clientHeight) >= node.scrollHeight;
        if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

// Inertial page scrolling for mouse wheels and trackpads, in the spirit of Lenis. It only ever moves
// the real window scroll position, so sticky elements, scroll-linked animations and the scrollbar
// keep working. Touch, keyboard and scrollbar dragging stay native, and it switches itself off for
// people who prefer reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    const root = document.documentElement;
    root.dataset.smoothScroll = "";

    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let lastTime = 0;
    // A timed glide, used for in-page links, instead of the wheel's open-ended easing.
    let glide: { from: number; to: number; start: number; duration: number } | null = null;

    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
    const clamp = (y: number) => Math.min(Math.max(y, 0), maxScroll());

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      glide = null;
    };

    const tick = (now: number) => {
      if (glide) {
        const t = Math.min((now - glide.start) / glide.duration, 1);
        current = glide.from + (glide.to - glide.from) * easeInOutCubic(t);
        target = current;
        if (t === 1) glide = null;
      } else {
        const frames = lastTime ? Math.min((now - lastTime) / (1000 / 60), 4) : 1;
        current += (target - current) * (1 - (1 - LERP) ** frames);
        if (Math.abs(target - current) < 0.4) current = target;
      }
      lastTime = now;
      window.scrollTo(0, current);

      if (glide || current !== target) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        lastTime = 0;
      }
    };

    const run = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey) return; // ctrl + wheel is pinch-to-zoom
      if (event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (nestedCanScroll(event.target, event.deltaY)) return;

      const delta =
        event.deltaMode === 1
          ? event.deltaY * LINE_HEIGHT
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      event.preventDefault();
      if (!frame) current = target = window.scrollY;
      glide = null;
      target = clamp(target + delta);
      run();
    };

    // Anything else that moves the page (keys, scrollbar, the router going to a new page) wins.
    const onScroll = () => {
      if (frame && Math.abs(window.scrollY - current) > 2) {
        stop();
        current = target = window.scrollY;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href^='#']");
      if (!link || link.hash.length < 2) return;
      const destination = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!destination) return;

      event.preventDefault();
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const to = clamp(destination.getBoundingClientRect().top + window.scrollY - offset);
      const distance = Math.abs(to - window.scrollY);
      stop();
      current = window.scrollY;
      glide = {
        from: current,
        to,
        start: performance.now(),
        duration: Math.min(1400, 600 + distance * 0.25),
      };
      run();
      history.pushState(null, "", link.hash);
      // Keep keyboard users where they meant to go, as a native jump would.
      if (destination.tabIndex >= 0 || destination.hasAttribute("tabindex")) {
        destination.focus({ preventScroll: true });
      }
    };

    const onResize = () => {
      target = clamp(target);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("click", onClick);

    return () => {
      stop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onClick);
      delete root.dataset.smoothScroll;
    };
  }, []);

  return null;
}
