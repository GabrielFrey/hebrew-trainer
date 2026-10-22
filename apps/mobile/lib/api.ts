import { Platform } from "react-native";
import { drainQueue } from "./offline";
import { loadToken, saveToken } from "./tokens";

export const API =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:43180" : "http://127.0.0.1:43180");

let access = "";

export function setToken(token: string) {
  access = token;
  void saveToken(token);
}

export async function hydrateToken(): Promise<string | null> {
  const stored = await loadToken();
  if (stored) access = stored;
  return stored;
}

export function clearToken() {
  access = "";
  void saveToken(null);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function replayOffline(): Promise<void> {
  try {
    await drainQueue((path, init) => api(path, init));
  } catch {
    /* stay queued */
  }
}

export type UiLang = "en" | "ru" | "he" | "uk" | "es" | "fr";

export type User = {
  id: string;
  display_name: string;
  role: string;
  ui_language: UiLang;
  timezone: string;
  motivation: string;
  xp_total: number;
  streak: number;
  hearts: number;
  league: string;
  level: string;
  daily_goal_xp: number;
  niqqud_default: boolean;
  translit_default: boolean;
  course_id?: string;
};

export type Lesson = {
  slug: string;
  title: Record<string, string>;
  objective: Record<string, string>;
  explanation: Record<string, string>;
  vocabulary: Array<Record<string, string | null>>;
  exercises: Exercise[];
  threshold: number;
  level: string;
  cefr: string;
  track: string;
  audio: { capability: string };
  speech: { capability: string };
};

export type Exercise = {
  id: string;
  type: string;
  prompt: Record<string, string>;
  choices?: Array<Record<string, string>>;
  tokens?: string[];
  left?: string[];
  right?: string[];
  keyboard?: boolean;
  optional?: boolean;
  requires_audio?: boolean;
  honest_fallback?: string;
};

export type PathNode = {
  slug: string;
  title: Record<string, string>;
  track: string;
  level: string;
  kind: string;
  unlocked: boolean;
  completed: boolean;
  accuracy?: number;
  prerequisites: string[];
};

export async function demoLogin(body: {
  ui_language: string;
  display_name: string;
  motivation: string;
  role?: string;
  course_id?: string;
}) {
  const data = await api<{ access_token: string; user: User }>("/auth/demo", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      email: body.role === "editor" ? "demo-editor@biti.local" : `demo-${crypto.randomUUID()}@biti.local`,
    }),
  });
  setToken(data.access_token);
  return data.user;
}
