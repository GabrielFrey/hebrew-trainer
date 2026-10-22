import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 43180;

function firstHost(raw: unknown): string | null {
  if (!raw) return null;
  const text = String(raw);
  const stripped = text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split("/")[0];
  const host = stripped.split(":")[0]?.trim();
  if (!host) return null;
  if (host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "0.0.0.0") return null;
  return host;
}

/** LAN IP of the Metro packager (Expo Go on a phone), never loopback. */
export function packagerHost(): string | null {
  const extra = Constants as typeof Constants & {
    linkingUri?: string;
    debuggerHost?: string;
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string; hostUri?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const candidates = [
    process.env.EXPO_PUBLIC_PACKAGER_HOST,
    extra.expoConfig?.hostUri,
    extra.expoGoConfig?.debuggerHost,
    extra.manifest2?.extra?.expoGo?.debuggerHost,
    extra.manifest?.debuggerHost,
    extra.manifest?.hostUri,
    extra.debuggerHost,
    extra.linkingUri,
  ];
  for (const raw of candidates) {
    const host = firstHost(raw);
    if (host) return host;
  }
  return null;
}

export function defaultApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "";
  const host = packagerHost();
  const explicitIsLoopback = /:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::|\/|$)/i.test(explicit);
  if (explicit && !(explicitIsLoopback && host && Platform.OS !== "web")) {
    return explicit;
  }
  if (host) return `http://${host}:${API_PORT}`;
  if (explicit) return explicit;
  if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
  return `http://127.0.0.1:${API_PORT}`;
}

export function apiHostLabel(base = defaultApiBase()): string {
  try {
    return new URL(base).host;
  } catch {
    return base;
  }
}
