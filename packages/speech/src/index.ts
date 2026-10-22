export type SpeechCapability = "unavailable" | "recognition-only" | "pronunciation-scoring";

export function speechCapability(provider?: string): SpeechCapability {
  if (!provider) return "unavailable";
  return "recognition-only";
}
