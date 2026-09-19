import { cn } from "@/lib/utils";

// Swaps between two words in place: one slides up out of view as the other rises in from below.
//
// It's a pure CSS loop (see word-cycle in globals.css) rather than React state, so nothing
// re-renders, and only transform and opacity animate, which the browser runs on the compositor.
// Both words share one grid cell, so the wrapper is always as wide as the wider word and the line
// never reflows. The second word runs half a cycle behind the first. Under reduced motion the loop
// stops and only the first word shows.
export function RotatingWord({
  words,
  className,
}: {
  words: readonly [string, string];
  className?: string;
}) {
  const word = "will-change-[transform,opacity] [grid-area:1/1] motion-reduce:animate-none";

  return (
    <span className="inline-grid overflow-hidden align-bottom">
      <span className={cn(word, "inline-block animate-word-cycle", className)}>{words[0]}</span>
      <span
        className={cn(
          word,
          "inline-block animate-word-cycle [animation-delay:-2.6s] motion-reduce:opacity-0",
          className,
        )}
      >
        {words[1]}
      </span>
    </span>
  );
}
