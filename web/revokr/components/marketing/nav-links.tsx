"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#how-it-works", label: "Workflow" },
  { href: "#features", label: "Capabilities" },
  { href: "#security", label: "Security" },
];

// The header's section links. The one for the part of the page you're in is lit: full white with a
// line under it. What counts as "in" is whatever is at a marker 40% of the way down the window, so
// the link changes as a section reaches the middle of the screen rather than the moment its edge
// appears. Home is everything above Workflow (the hero, the product preview and the strips under
// it); after Security, at the closing call to action, none is lit.
export function NavLinks() {
  const [current, setCurrent] = useState<string | null>(LINKS[0].href);

  useEffect(() => {
    // Home isn't a section of its own to measure against, so only the others are looked up.
    const sections = LINKS.slice(1).flatMap((link) => {
      const element = document.getElementById(link.href.slice(1));
      return element ? [{ href: link.href, element }] : [];
    });

    let frame = 0;
    const update = () => {
      frame = 0;
      const marker = window.innerHeight * 0.4;
      const first = sections[0];
      if (!first || first.element.getBoundingClientRect().top > marker) {
        setCurrent(LINKS[0].href);
        return;
      }
      const inside = sections.find(({ element }) => {
        const box = element.getBoundingClientRect();
        return box.top <= marker && box.bottom > marker;
      });
      setCurrent(inside ? inside.href : null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
      {LINKS.map((link) => {
        const active = link.href === current;
        return (
          <a
            key={link.href}
            href={link.href}
            aria-current={active ? "location" : undefined}
            className={cn(
              "relative rounded-sm py-1 text-[13px] transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
              "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-foreground after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none",
              active ? "text-foreground after:scale-x-100" : "text-foreground/70 after:scale-x-0",
            )}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
