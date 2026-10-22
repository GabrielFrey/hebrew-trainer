import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { User } from "./api";

const KEY = "biti_session_v1";
const LEGACY_TOKEN = "biti_token";

export type LocalAttempt = {
  id: string;
  slug: string;
  results: Record<string, { result: string; score?: number; rule_ids?: string[]; diff?: unknown[] }>;
  combo: number;
  hint_level: number;
};

export type LocalSession = {
  source: "remote" | "local";
  token: string | null;
  user: User;
  done: Record<string, number>;
  attempts: Record<string, LocalAttempt>;
  badges: string[];
  apiBase?: string;
};

let memory: LocalSession | null = null;

function webStore(): Storage | null {
  if (Platform.OS !== "web") return null;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

async function readRaw(key: string): Promise<string | null> {
  const web = webStore();
  if (web) return web.getItem(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string | null): Promise<void> {
  const web = webStore();
  if (web) {
    if (value) web.setItem(key, value);
    else web.removeItem(key);
    return;
  }
  try {
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  } catch {
    /* keychain unavailable */
  }
}

export async function loadSession(): Promise<LocalSession | null> {
  if (memory) return memory;
  const raw = await readRaw(KEY);
  if (raw) {
    try {
      memory = JSON.parse(raw) as LocalSession;
      return memory;
    } catch {
      /* ignore */
    }
  }
  const legacy = await readRaw(LEGACY_TOKEN);
  if (legacy) {
    memory = null;
    return null;
  }
  return null;
}

export async function saveSession(next: LocalSession | null): Promise<void> {
  memory = next;
  await writeRaw(KEY, next ? JSON.stringify(next) : null);
  await writeRaw(LEGACY_TOKEN, next?.token || null);
}

export function peekSession(): LocalSession | null {
  return memory;
}

export async function loadToken(): Promise<string | null> {
  const session = await loadSession();
  if (session?.token) return session.token;
  return readRaw(LEGACY_TOKEN);
}

export async function saveToken(value: string | null): Promise<void> {
  if (!value) {
    if (memory) {
      memory = { ...memory, token: null, source: "local" };
      await writeRaw(KEY, JSON.stringify(memory));
    }
    await writeRaw(LEGACY_TOKEN, null);
    return;
  }
  await writeRaw(LEGACY_TOKEN, value);
}

export function newId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
