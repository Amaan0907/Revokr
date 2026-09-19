import { Eyebrow } from "@/components/ds/primitives";

// Rotation makes a leaked key worthless; it doesn't make the leak disappear. Said on every incident
// so nobody assumes a resolved incident means the secret is gone from the repository.
export function HistoryWarning() {
  return (
    <section
      aria-labelledby="history-heading"
      className="flex flex-col gap-2 rounded-[18px] border border-high/30 bg-card p-5"
    >
      <Eyebrow id="history-heading" className="tracking-[.14em] text-high">
        history warning
      </Eyebrow>
      <span className="text-[12px] leading-[1.6] text-muted-foreground">
        Rotation does not remove the secret from git history. It still exists in earlier commits, other
        branches, tags, forks and any clone already pulled. Rewriting history is a separate, coordinated
        action — and the old credential being disabled is what actually makes the copies worthless.
      </span>
    </section>
  );
}
