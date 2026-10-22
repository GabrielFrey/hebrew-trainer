/** IDs that work on Hermes (Expo Go). Never touch the bare `crypto` identifier. */

type CryptoLike = { randomUUID?: () => string };

export function newId(prefix = "id"): string {
  try {
    const c = (globalThis as { crypto?: CryptoLike }).crypto;
    if (typeof c?.randomUUID === "function") return `${prefix}-${c.randomUUID()}`;
  } catch {
    /* Hermes: Property 'crypto' doesn't exist */
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
