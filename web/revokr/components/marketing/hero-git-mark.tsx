"use client";

import { useEffect, useRef } from "react";

// How far from the figure's centre the pointer can be, in figure widths, and still steer the light.
const REACH = 1.1;
// The share of the remaining distance the light covers each frame: quick while it chases the
// pointer, slow while it glides back into its drift.
const CHASE = 0.14;
const GLIDE = 0.06;
// Seconds for the idle light to make one lap round the figure.
const LAP = 18;

// A git branch graph, as in the branch icon: a trunk, a branch that joins it, and a dot on each end.
const TRUNK = "M70 40V200";
const BRANCH = "M170 80C170 130 70 110 70 150";
const COMMITS: [number, number][] = [
  [70, 40],
  [70, 200],
  [170, 80],
];

// Where the idle light is at time t (seconds), as the light state below. It laps the figure slowly,
// starting top-left and passing the left and bottom, and every so often spreads wide enough to
// light the graph all round before narrowing to one side again.
function idleLight(t: number) {
  const angle = (5 * Math.PI) / 4 - (t * 2 * Math.PI) / LAP;
  const reach = 0.5 + 0.08 * Math.sin(t * 0.7);
  const wide = Math.max(0, Math.sin((t * 2 * Math.PI) / (LAP * 1.3)));
  return {
    x: Math.cos(angle) * reach,
    y: Math.sin(angle) * reach,
    lit: 0.85 + 0.15 * Math.sin(t * 0.9),
    spread: 1 + 1.4 * wide * wide,
  };
}

// With reduced motion the light doesn't drift: it sits below the figure, lit from underneath.
const STILL = { x: 0, y: 0.5, lit: 0.85, spread: 1.3 };

// Just the graph, drawn in black with a white light behind it, so it shows as a dark shape with a
// glowing edge. The light drifts round the figure on its own; when the pointer comes near, it
// leaves its drift and follows the pointer, and when the pointer goes it glides back.
//
// The light is driven by --light-x, --light-y (its offset from the figure's centre, in px),
// --light-spread (how wide it reaches, 1 = normal) and --lit (its brightness). They're written
// straight onto the element from one frame loop, so nothing re-renders. The loop pauses while the
// figure is off screen.
export function HeroGitMark() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = { ...STILL };
    const pointer = { x: 0, y: 0 };
    let hovering = false;
    let visible = true;
    let frame = 0;

    const tick = (time: number) => {
      frame = 0;
      const aim = hovering ? { ...pointer, lit: 1, spread: 1 } : reduced ? STILL : idleLight(time / 1000);
      const ease = reduced ? 1 : hovering ? CHASE : GLIDE;
      light.x += (aim.x - light.x) * ease;
      light.y += (aim.y - light.y) * ease;
      light.lit += (aim.lit - light.lit) * ease;
      light.spread += (aim.spread - light.spread) * ease;

      const size = el.offsetWidth;
      el.style.setProperty("--light-x", `${light.x * size}px`);
      el.style.setProperty("--light-y", `${light.y * size}px`);
      el.style.setProperty("--light-spread", light.spread.toFixed(3));
      el.style.setProperty("--lit", light.lit.toFixed(3));

      // The drift never settles, so it keeps going; without it, stop once the light has arrived.
      const settled =
        Math.abs(aim.x - light.x) + Math.abs(aim.y - light.y) + Math.abs(aim.lit - light.lit) < 0.002;
      if (visible && !(reduced && settled)) frame = requestAnimationFrame(tick);
    };

    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      pointer.x = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      pointer.y = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      hovering = Math.hypot(pointer.x, pointer.y) < REACH;
      schedule();
    };

    const onLeave = () => {
      hovering = false;
      schedule();
    };

    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    watcher.observe(el);

    schedule();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      watcher.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="animate-lift relative size-(--size) [--size:clamp(220px,26vw,400px)] [animation-delay:400ms]"
    >
      {/* White copies of the graph sit behind the black one, so light shows only around its edges.
          First a faint glow all round, so the graph is always readable... */}
      <Graph weight={14} className="text-white/20 blur-md" />

      {/* ...then a wide, soft haze that only shows near the light... */}
      <div className="light-follow absolute -inset-1/2">
        <Graph weight={22} className="text-white/50 blur-3xl will-change-transform" />
      </div>

      {/* ...a tighter glow on the same side, so light spills past the lines... */}
      <div className="light-follow absolute -inset-1/2">
        <Graph weight={14} className="text-white blur-md will-change-transform" />
      </div>

      {/* ...and a hairline, a touch wider than the black graph, so the edge nearest the light is sharp. */}
      <div className="light-follow absolute -inset-1/2">
        <Graph weight={10} className="text-white" />
      </div>

      {/* The graph itself: black. */}
      <Graph weight={8} className="text-black" />
    </div>
  );
}

// The graph, centred in whatever box it's given and one figure-width across. A wider weight draws
// thicker lines and bigger dots, so copies of different weights can be stacked to make an outline.
function Graph({ weight, className }: { weight: number; className: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      strokeLinecap="round"
      className={`absolute left-1/2 top-1/2 size-(--size) -translate-x-1/2 -translate-y-1/2 ${className}`}
    >
      <path d={TRUNK} stroke="currentColor" strokeWidth={weight} />
      <path d={BRANCH} stroke="currentColor" strokeWidth={weight} />
      {COMMITS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={weight / 2 + 7} fill="currentColor" />
      ))}
    </svg>
  );
}
