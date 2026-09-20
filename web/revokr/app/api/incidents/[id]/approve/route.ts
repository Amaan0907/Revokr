import type { NextRequest } from "next/server";
import { forwardDecision } from "@/lib/incident-decision";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardDecision(request, id, "approve");
}
