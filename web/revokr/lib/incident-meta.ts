import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Ban,
  CircleCheck,
  CircleX,
  FileKey,
  Gauge,
  Hourglass,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Radar,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import type {
  ActionType,
  AuditAction,
  AuditLogEntry,
  IncidentStatus,
  Provider,
  Severity,
} from "./types";

// The fixed order every rotation follows. Validation runs before the approval gate; the rest after.
export const REMEDIATION_PLAN: ActionType[] = [
  "VALIDATE_CREDENTIAL",
  "ROTATE_CREDENTIAL",
  "UPDATE_GITHUB_SECRET",
  "DISABLE_OLD_CREDENTIAL",
  "SEND_NOTIFICATION",
];

export const ACTION_META: Record<ActionType, { label: string; description: string }> = {
  VALIDATE_CREDENTIAL: {
    label: "Validate the leaked credential",
    description: "Ask the provider whether the key still works.",
  },
  ROTATE_CREDENTIAL: {
    label: "Create a replacement",
    description: "Issue a new credential and confirm it works before touching anything else.",
  },
  UPDATE_GITHUB_SECRET: {
    label: "Update the GitHub Actions secret",
    description: "Encrypt the new value with the repository's public key and store it.",
  },
  DISABLE_OLD_CREDENTIAL: {
    label: "Disable the leaked credential",
    description: "Deactivate the old key, then confirm the provider rejects it.",
  },
  SEND_NOTIFICATION: {
    label: "Notify the team",
    description: "Post a summary of what happened to the security channel.",
  },
  CLEAN_HISTORY: {
    label: "Clean git history",
    description: "Remove the secret from past commits.",
  },
};

export const PROVIDER_LABEL: Record<Provider, string> = {
  aws: "AWS",
  openai: "OpenAI",
  github: "GitHub",
  gcp: "GCP",
  stripe: "Stripe",
  slack: "Slack",
  generic: "Generic",
};

// Full class names are spelled out so Tailwind can find them when it scans the source.
interface Tone {
  text: string;
  bg: string;
  border: string;
}

const PROGRESS: Tone = { text: "text-progress", bg: "bg-progress/15", border: "border-progress/30" };
const APPROVAL: Tone = { text: "text-approval", bg: "bg-approval/15", border: "border-approval/30" };
const RESOLVED: Tone = { text: "text-resolved", bg: "bg-resolved/15", border: "border-resolved/30" };
const FAILED: Tone = { text: "text-failed", bg: "bg-failed/15", border: "border-failed/30" };
const ATTENTION: Tone = { text: "text-attention", bg: "bg-attention/15", border: "border-attention/30" };
const UNSUPPORTED: Tone = { text: "text-unsupported", bg: "bg-unsupported/15", border: "border-unsupported/30" };

export const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

// ring: the two ends of the Activity-ring gradient on the risk gauge (SVG stops need literal colours).
export const SEVERITY_META: Record<
  Severity,
  Tone & { label: string; level: number; fill: string; ring: [string, string] }
> = {
  CRITICAL: { label: "Critical", level: 4, text: "text-critical", bg: "bg-critical/15", border: "border-critical/30", fill: "bg-critical", ring: ["#a4544f", "#c98882"] },
  HIGH: { label: "High", level: 3, text: "text-high", bg: "bg-high/15", border: "border-high/30", fill: "bg-high", ring: ["#a37a54", "#c9a683"] },
  MEDIUM: { label: "Medium", level: 2, text: "text-medium", bg: "bg-medium/15", border: "border-medium/30", fill: "bg-medium", ring: ["#978b62", "#c4ba90"] },
  LOW: { label: "Low", level: 1, text: "text-low", bg: "bg-low/15", border: "border-low/30", fill: "bg-low", ring: ["#75899a", "#a6b8c4"] },
};

export const MOTION_CLASS = {
  spin: "animate-spin [animation-duration:2.5s]",
  pulse: "animate-pulse",
} as const;

export type StatusGroup = "active" | "attention" | "resolved" | "failed" | "closed";

export const STATUS_META: Record<
  IncidentStatus,
  Tone & {
    label: string;
    description: string;
    icon: LucideIcon;
    group: StatusGroup;
    motion?: "spin" | "pulse";
  }
> = {
  DETECTED: {
    ...PROGRESS,
    label: "Detected",
    description: "Found in a push and not yet checked with the provider.",
    icon: Radar,
    group: "active",
    motion: "pulse",
  },
  VALIDATING: {
    ...PROGRESS,
    label: "Validating",
    description: "Checking whether the credential still works.",
    icon: LoaderCircle,
    group: "active",
    motion: "spin",
  },
  AWAITING_APPROVAL: {
    ...APPROVAL,
    label: "Awaiting approval",
    description: "Rotation is ready and needs a person to approve it.",
    icon: Hourglass,
    group: "attention",
  },
  ROTATING: {
    ...PROGRESS,
    label: "Rotating",
    description: "Creating a replacement credential and updating where it's used.",
    icon: RefreshCw,
    group: "active",
    motion: "spin",
  },
  VERIFYING: {
    ...PROGRESS,
    label: "Verifying",
    description: "Confirming the leaked credential is now rejected.",
    icon: ScanSearch,
    group: "active",
    motion: "pulse",
  },
  RESOLVED: {
    ...RESOLVED,
    label: "Resolved",
    description: "Replaced, and the leaked credential is confirmed dead.",
    icon: ShieldCheck,
    group: "resolved",
  },
  FAILED: {
    ...FAILED,
    label: "Failed",
    description: "A remediation step failed. The leaked credential may still work.",
    icon: CircleX,
    group: "failed",
  },
  REQUIRES_USER_ACTION: {
    ...ATTENTION,
    label: "Needs action",
    description: "This provider can't be rotated automatically, so someone has to do it by hand.",
    icon: TriangleAlert,
    group: "attention",
  },
  NOT_SUPPORTED: {
    ...UNSUPPORTED,
    label: "Not supported",
    description: "Revokr can't validate or rotate this kind of secret.",
    icon: Ban,
    group: "closed",
  },
};

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; icon: LucideIcon }> = {
  detected: { label: "Secret detected", icon: Radar },
  validated: { label: "Validated", icon: BadgeCheck },
  risk_scored: { label: "Risk scored", icon: Gauge },
  auth_requested: { label: "Approval requested", icon: Hourglass },
  approved: { label: "Rotation approved", icon: UserRoundCheck },
  denied: { label: "Rotation denied", icon: UserRoundX },
  key_created: { label: "Replacement key created", icon: KeyRound },
  old_key_disabled: { label: "Leaked key disabled", icon: LockKeyhole },
  gh_secret_updated: { label: "GitHub secret updated", icon: FileKey },
  verified: { label: "Leaked key confirmed dead", icon: ShieldCheck },
  resolved: { label: "Incident resolved", icon: CircleCheck },
  failed: { label: "Remediation step failed", icon: CircleX },
};

export function auditLabel(entry: AuditLogEntry): string {
  const { action, result } = entry;
  if (action === "validated") {
    if (result === "pending") return "Checking if the key is live";
    if (result === "failure") return "Couldn't validate this secret";
    return entry.metadata?.isLive === false ? "Key is not live" : "Confirmed live";
  }
  if (action === "verified" && result === "pending") return "Confirming the leaked key is dead";
  if (action === "failed" && result === "pending") return "Needs manual rotation";
  return AUDIT_ACTION_META[action].label;
}

export function auditTone(entry: AuditLogEntry): string {
  if (entry.result === "failure") return "text-failed";
  if (entry.result === "pending") {
    if (entry.action === "auth_requested") return "text-approval";
    if (entry.action === "failed") return "text-attention";
    return "text-progress";
  }
  if (entry.action === "verified" || entry.action === "resolved") return "text-resolved";
  if (entry.action === "approved") return "text-progress";
  return "text-muted-foreground";
}
