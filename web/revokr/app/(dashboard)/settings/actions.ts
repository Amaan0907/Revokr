"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { SIMULATION_COOKIE } from "@/lib/settings";

// Server actions are reachable by anyone who can POST to them, so check the session here rather
// than trusting that only the settings page calls this.
export async function setSimulationMode(enabled: boolean): Promise<void> {
  if (!(await getSession())) throw new Error("Not signed in");

  (await cookies()).set(SIMULATION_COOKIE, enabled ? "on" : "off", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  // The banner and sidebar badge live in the shared layout.
  revalidatePath("/", "layout");
}
