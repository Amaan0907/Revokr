import { cookies } from "next/headers";
import { mockIncidents } from "./mock-data";

export const SIMULATION_COOKIE = "revokr_simulation";

// Simulation mode is a workspace setting. Until it has been changed the workspace follows its
// data: it's on when the incidents it holds were created in simulation.
export async function getSimulationMode(): Promise<boolean> {
  const stored = (await cookies()).get(SIMULATION_COOKIE)?.value;
  if (stored === "on") return true;
  if (stored === "off") return false;
  return mockIncidents.some((incident) => incident.simulated);
}
