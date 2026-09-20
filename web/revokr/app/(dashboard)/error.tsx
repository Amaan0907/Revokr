"use client";

import { ApiUnreachable } from "@/components/states/api-unreachable";

// Any screen whose data fails to load lands here, inside the shell, so navigation still works.
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ApiUnreachable onRetry={reset} />;
}
