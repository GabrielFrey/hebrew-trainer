const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:43180";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

export function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("biti_token");
}

export function setToken(value: string | null) {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem("biti_token", value);
  else localStorage.removeItem("biti_token");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const t = token();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const res = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
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
  return res.json() as Promise<T>;
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
  course_id: string;
  course?: { id: string; source: string; pair: string; title: Record<string, string> };
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
  unit_id?: string;
  skill_id?: string;
};

export type PathUnit = {
  id: string;
  title: Record<string, string>;
  level: string;
  track: string;
  skills: Array<{ id: string; title: Record<string, string>; nodes: PathNode[] }>;
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
  checkpoint_slug?: string | null;
  nodes: PathNode[];
  checkpoint: PathNode;
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
