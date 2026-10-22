export type AudioCapability = "unavailable" | "generating" | "ready";

export function audioCapability(hasKey: boolean): AudioCapability {
  return hasKey ? "ready" : "unavailable";
}
