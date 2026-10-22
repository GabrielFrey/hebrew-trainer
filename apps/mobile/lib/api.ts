import { drainQueue } from "./offline";
import { apiHostLabel, defaultApiBase } from "./api-host";
import { canServeLocally, localHandle } from "./local-api";
import { loadSession, loadToken, peekSession, saveSession, saveToken, newId } from "./session";

const FETCH_MS = 2500;

export type Connection = "online" | "offline" | "unknown";

let access = "";
let lastConnection: Connection = "unknown";
let lastReachableHost: string | null = null;

export function connectionState(): Connection {
  return lastConnection;
}

export function lastApiHost(): string {
  return lastReachableHost || apiHostLabel();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public retryable = false,
  ) {
    super(detail);
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
  kind?: string;
  test_out?: boolean;
  mistake_limit?: number | null;
  stage?: { id: string; ulpan: string; cefr: string; title: Record<string, string> };
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
  status?: string;
};

export type PathStage = {
  id: string;
  ulpan: string;
  cefr: string;
  title: Record<string, string>;
  progress: { completed: number; published: number };
  planned_count: number;
  open: boolean;
  badge: boolean;
  nodes: PathNode[];
  checkpoint: PathNode;
};

function unreachableMessage(base: string, err: unknown): string {
  const host = apiHostLabel(base);
  const why = err instanceof Error ? err.message : "network error";
  return `Could not reach the lesson server at ${host} (${why}). Start offline, or retry when the API is running on port 43180.`;
}

async function remoteFetch<T>(path: string, init: RequestInit, base: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(`${base}${path}`, { ...init, headers, signal: ctrl.signal });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail, res.status >= 500);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const base = defaultApiBase();
  lastReachableHost = apiHostLabel(base);
  try {
    const data = await remoteFetch<T>(path, init, base);
    lastConnection = "online";
    return data;
  } catch (err) {
    if (canServeLocally(path, method)) {
      lastConnection = "offline";
      return localHandle<T>(path, init);
    }
    const detail = unreachableMessage(base, err);
    throw new ApiError(err instanceof ApiError ? err.status : 0, detail, true);
  }
}

export function setToken(token: string) {
  access = token;
  void saveToken(token);
}

export async function hydrateToken(): Promise<string | null> {
  const session = await loadSession();
  if (session?.token) {
    access = session.token.startsWith("local:") ? "" : session.token;
    return session.token;
  }
  const stored = await loadToken();
  if (stored && !stored.startsWith("local:")) access = stored;
  return stored;
}

export function clearToken() {
  access = "";
  void saveSession(null);
}

export async function replayOffline(): Promise<void> {
  try {
    await drainQueue((path, init) => api(path, init));
  } catch {
    /* stay queued */
  }
}

export async function demoLogin(body: {
  ui_language: string;
  display_name: string;
  motivation: string;
  role?: string;
  course_id?: string;
}): Promise<User> {
  const payload = {
    ...body,
    email: body.role === "editor" ? "demo-editor@biti.local" : `demo-${newId("demo")}@biti.local`,
  };
  try {
    const data = await remoteFetch<{ access_token: string; user: User }>(
      "/auth/demo",
      { method: "POST", body: JSON.stringify(payload) },
      defaultApiBase(),
    );
    lastConnection = "online";
    setToken(data.access_token);
    await saveSession({
      source: "remote",
      token: data.access_token,
      user: data.user,
      done: {},
      attempts: {},
      badges: [],
      apiBase: defaultApiBase(),
    });
    return data.user;
  } catch {
    lastConnection = "offline";
    const data = await localHandle<{ access_token: string; user: User }>("/auth/demo", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    access = "";
    return data.user;
  }
}

export { peekSession };
