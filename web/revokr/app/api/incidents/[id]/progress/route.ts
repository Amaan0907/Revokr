import { NextResponse, type NextRequest } from "next/server";
import { apiConfigured } from "@/lib/api";
import { getIncidentProgress } from "@/lib/data";
import { canViewLiveData } from "@/lib/live-data";
import { getSession } from "@/lib/session";

// What the incident page polls while a rotation runs. Deliberately not the analysis: each analysis
// request may call a model, so it is fetched once when the page loads and never on a timer.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Sign in to view this incident." }, { status: 401 });
  }
  if (!apiConfigured()) {
    return NextResponse.json({ ok: false, message: "The dashboard isn't connected to a Revokr API." }, { status: 503 });
  }
  if (!canViewLiveData(session)) {
    return NextResponse.json({ ok: false, message: "This account can't view live incidents." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const progress = await getIncidentProgress(id);
    if (!progress) return NextResponse.json({ ok: false, message: "No such incident." }, { status: 404 });
    return NextResponse.json(progress, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, message: "Couldn't reach the Revokr API." }, { status: 502 });
  }
}
