import type { CSSProperties, ReactNode } from "react";
import { Check, FileCode, Lock, Radar, ShieldCheck } from "lucide-react";
import { RiskGauge } from "@/components/incident-detail/risk-gauge";
import { LogoMark } from "@/components/shell/logo";
import { cn } from "@/lib/utils";

// Spelled out in full so Tailwind finds each class when it scans the source.
const GLOW = {
  critical: "bg-[radial-gradient(70%_55%_at_50%_0%,rgb(255_69_58/0.16),transparent_70%)]",
  approval: "bg-[radial-gradient(70%_55%_at_50%_0%,rgb(255_214_10/0.12),transparent_70%)]",
  resolved: "bg-[radial-gradient(70%_55%_at_50%_0%,rgb(48_209_88/0.14),transparent_70%)]",
} as const;

// Children rise in one after another each time a visual mounts.
function stagger(i: number): { className: string; style: CSSProperties } {
  return {
    className: "animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-both",
    style: { animationDelay: `${120 + i * 110}ms` },
  };
}

function VisualFrame({ glow, children }: { glow: keyof typeof GLOW; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="surface relative flex h-full min-h-80 flex-col items-center justify-center gap-6 overflow-hidden rounded-[28px] p-6 sm:p-10"
    >
      <div className={cn("pointer-events-none absolute inset-0", GLOW[glow])} />
      <div className="relative flex w-full flex-col items-center gap-6">{children}</div>
    </div>
  );
}

const ENV_FILE = [
  { line: 1, code: "NODE_ENV=production" },
  { line: 2, code: "DATABASE_URL=postgres://db.internal/app" },
  { line: 3, code: "AWS_REGION=us-east-1" },
  { line: 4, code: "AWS_ACCESS_KEY_ID=AKIA••••••••••••7QXM", leak: true },
  { line: 5, code: "LOG_LEVEL=info" },
];

export function DetectVisual() {
  const card = stagger(0);
  const chip = stagger(2);
  return (
    <VisualFrame glow="critical">
      <div
        className={cn(
          "w-full max-w-md overflow-hidden rounded-2xl bg-black/70 shadow-2xl ring-1 ring-white/10",
          card.className,
        )}
        style={card.style}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-xs text-muted-foreground">
          <FileCode className="size-3.5" />
          <span className="font-mono">config/.env.production</span>
          <span className="ml-auto font-mono">4e1a9c7</span>
        </div>
        <div className="py-3 font-mono text-[12.5px] leading-7">
          {ENV_FILE.map((row) => (
            <div
              key={row.line}
              className={cn(
                "flex gap-4 px-4",
                row.leak && "bg-critical/10 shadow-[inset_2px_0_0_var(--critical)]",
              )}
            >
              <span className="w-3 shrink-0 select-none text-right text-muted-foreground/50">
                {row.line}
              </span>
              <span className={cn("truncate", row.leak ? "text-foreground" : "text-muted-foreground")}>
                {row.code}
              </span>
            </div>
          ))}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-critical/15 px-3.5 py-1.5 text-[13px] font-medium text-critical ring-1 ring-inset ring-critical/30",
          chip.className,
        )}
        style={chip.style}
      >
        <Radar className="size-4" />
        Secret found 0.4s after the push
      </span>
    </VisualFrame>
  );
}

const FACTORS = [
  { factor: "Key is live", points: 40 },
  { factor: "Public repository", points: 25 },
  { factor: "Reaches production", points: 20 },
  { factor: "Pushed minutes ago", points: 11 },
];

export function ScoreVisual({ gradientId }: { gradientId: string }) {
  const note = stagger(FACTORS.length + 1);
  return (
    <VisualFrame glow="critical">
      <div className="flex w-full max-w-md flex-col items-center gap-6 sm:flex-row">
        <RiskGauge score={96} severity="CRITICAL" gradientId={gradientId} />
        <ul className="w-full flex-1 divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-black/60 ring-1 ring-white/10">
          {FACTORS.map((row, i) => {
            const motion = stagger(i + 1);
            return (
              <li
                key={row.factor}
                className={cn("flex items-center justify-between gap-4 px-4 py-2.5 text-sm", motion.className)}
                style={motion.style}
              >
                <span>{row.factor}</span>
                <span className="font-medium tabular-nums text-critical">+{row.points}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className={cn("text-[13px] text-muted-foreground", note.className)} style={note.style}>
        Confirmed live with AWS, 1.2 seconds after detection
      </p>
    </VisualFrame>
  );
}

export function ApproveVisual() {
  const card = stagger(0);
  const note = stagger(2);
  return (
    <VisualFrame glow="approval">
      <div className={cn("relative w-full max-w-sm", card.className)} style={card.style}>
        <div className="absolute inset-x-5 -bottom-2.5 h-full rounded-[22px] bg-white/[0.04] ring-1 ring-white/[0.06]" />
        <div className="glass-rim relative rounded-[22px] bg-[#232326]/90 p-4 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_20px_50px_-12px_rgb(0_0_0/0.8)]">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LogoMark className="size-5 rounded-[6px]" />
            <span className="font-semibold uppercase tracking-[0.06em]">Revokr</span>
            <span className="ml-auto">now</span>
          </div>
          <p className="mt-3 text-[15px] font-semibold">Approve rotation?</p>
          <p className="mt-1 text-sm leading-snug text-foreground/75">
            A live AWS access key leaked in acme/payments-api. A replacement is ready to go.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-medium">
            <span className="grid h-9 place-items-center rounded-full bg-white/10">Deny</span>
            <span className="relative grid h-9 place-items-center rounded-full bg-white text-black">
              <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-white/40 [animation-duration:2s]" />
              Approve
            </span>
          </div>
        </div>
      </div>
      <p
        className={cn("mt-2 flex items-center gap-2 text-[13px] text-muted-foreground", note.className)}
        style={note.style}
      >
        <Lock className="size-3.5" />
        Live credentials never change without a person.
      </p>
    </VisualFrame>
  );
}

const ROTATION = [
  { label: "Replacement key created", detail: "AKIA••••••••••••R2VD", at: "1.4s" },
  { label: "GitHub Actions secret updated", detail: "AWS_ACCESS_KEY_ID", at: "1.2s" },
  { label: "Leaked key disabled", detail: "AKIA••••••••••••7QXM", at: "1.2s" },
  { label: "Confirmed dead", detail: "AWS now rejects the old key", at: "1.5s" },
];

export function RotateVisual() {
  const banner = stagger(ROTATION.length);
  return (
    <VisualFrame glow="resolved">
      <ol className="w-full max-w-md divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-black/60 text-left ring-1 ring-white/10">
        {ROTATION.map((step, i) => {
          const motion = stagger(i);
          return (
            <li
              key={step.label}
              className={cn("flex items-center gap-3 px-4 py-3", motion.className)}
              style={motion.style}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-resolved text-black">
                <Check className="size-3" strokeWidth={3.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{step.label}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{step.detail}</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{step.at}</span>
            </li>
          );
        })}
      </ol>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-resolved/15 px-3.5 py-1.5 text-[13px] font-medium text-resolved ring-1 ring-inset ring-resolved/30",
          banner.className,
        )}
        style={banner.style}
      >
        <ShieldCheck className="size-4" />
        Resolved in 14.6 seconds, end to end
      </span>
    </VisualFrame>
  );
}
