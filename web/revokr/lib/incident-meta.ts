import type { LucideIcon } from "lucide-react";
import {
  Ban,
  CircleX,
  Hourglass,
  LoaderCircle,
  Radar,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { IncidentStatus, Severity } from "./types";

// Full class names are spelled out so Tailwind can find them when it scans the source.
interface Tone {
  text: string;
  bg: string;
  border: string;
}

const PROGRESS: Tone = { text: "text-progress", bg: "bg-progress/10", border: "border-progress/25" };
const APPROVAL: Tone = { text: "text-approval", bg: "bg-approval/10", border: "border-approval/25" };
const RESOLVED: Tone = { text: "text-resolved", bg: "bg-resolved/10", border: "border-resolved/25" };
const FAILED: Tone = { text: "text-failed", bg: "bg-failed/10", border: "border-failed/25" };
const ATTENTION: Tone = { text: "text-attention", bg: "bg-attention/10", border: "border-attention/25" };
const UNSUPPORTED: Tone = { text: "text-unsupported", bg: "bg-unsupported/10", border: "border-unsupported/25" };

export const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const SEVERITY_META: Record<Severity, Tone & { label: string; level: number }> = {
  CRITICAL: { label: "Critical", level: 4, text: "text-critical", bg: "bg-critical/10", border: "border-critical/25" },
  HIGH: { label: "High", level: 3, text: "text-high", bg: "bg-high/10", border: "border-high/25" },
  MEDIUM: { label: "Medium", level: 2, text: "text-medium", bg: "bg-medium/10", border: "border-medium/25" },
  LOW: { label: "Low", level: 1, text: "text-low", bg: "bg-low/10", border: "border-low/25" },
};

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
