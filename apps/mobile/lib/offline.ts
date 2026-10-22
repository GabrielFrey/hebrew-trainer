import { Platform } from "react-native";

export type QueuedEvent = {
  id: string;
  idempotency_key: string;
  type: "submit";
  attempt_id: string;
  body: Record<string, unknown>;
  created_at: string;
};

const MEMORY: QueuedEvent[] = [];
const LS_KEY = "biti-offline-queue";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fromLocalStorage(): QueuedEvent[] {
  if (Platform.OS !== "web") return MEMORY;
  try {
    return JSON.parse(globalThis.localStorage.getItem(LS_KEY) || "[]") as QueuedEvent[];
  } catch {
    return [];
  }
}

function persistLocal(rows: QueuedEvent[]) {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      /* quota */
    }
  } else {
    MEMORY.splice(0, MEMORY.length, ...rows);
  }
}

type QueueDriver = {
  backend: "sqlite" | "localStorage" | "memory";
  enqueue: (event: Omit<QueuedEvent, "id" | "created_at">) => Promise<QueuedEvent>;
  list: () => Promise<QueuedEvent[]>;
  remove: (id: string) => Promise<void>;
};

let driverPromise: Promise<QueueDriver> | null = null;

async function sqliteDriver(): Promise<QueueDriver | null> {
  try {
    const SQLite = await import("expo-sqlite");
    const db = await SQLite.openDatabaseAsync("biti-offline.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    return {
      backend: "sqlite",
      async enqueue(event) {
        const row: QueuedEvent = {
          ...event,
          id: newId(),
          created_at: new Date().toISOString(),
        };
        try {
          await db.runAsync(
            `INSERT INTO offline_queue (id, idempotency_key, type, attempt_id, body, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            row.id,
            row.idempotency_key,
            row.type,
            row.attempt_id,
            JSON.stringify(row.body),
            row.created_at,
          );
        } catch {
          const existing = await db.getFirstAsync<{
            id: string;
            idempotency_key: string;
            type: string;
            attempt_id: string;
            body: string;
            created_at: string;
          }>(`SELECT * FROM offline_queue WHERE idempotency_key = ?`, row.idempotency_key);
          if (existing) {
            return {
              id: existing.id,
              idempotency_key: existing.idempotency_key,
              type: existing.type as "submit",
              attempt_id: existing.attempt_id,
              body: JSON.parse(existing.body) as Record<string, unknown>,
              created_at: existing.created_at,
            };
          }
        }
        return row;
      },
      async list() {
        const rows = await db.getAllAsync<{
          id: string;
          idempotency_key: string;
          type: string;
          attempt_id: string;
          body: string;
          created_at: string;
        }>(`SELECT * FROM offline_queue ORDER BY created_at ASC`);
        return rows.map((r) => ({
          id: r.id,
          idempotency_key: r.idempotency_key,
          type: r.type as "submit",
          attempt_id: r.attempt_id,
          body: JSON.parse(r.body) as Record<string, unknown>,
          created_at: r.created_at,
        }));
      },
      async remove(id) {
        await db.runAsync(`DELETE FROM offline_queue WHERE id = ?`, id);
      },
    };
  } catch {
    return null;
  }
}

function fallbackDriver(): QueueDriver {
  return {
    backend: Platform.OS === "web" ? "localStorage" : "memory",
    async enqueue(event) {
      const rows = fromLocalStorage();
      const existing = rows.find((r) => r.idempotency_key === event.idempotency_key);
      if (existing) return existing;
      const row: QueuedEvent = { ...event, id: newId(), created_at: new Date().toISOString() };
      rows.push(row);
      persistLocal(rows);
      return row;
    },
    async list() {
      return fromLocalStorage();
    },
    async remove(id) {
      persistLocal(fromLocalStorage().filter((r) => r.id !== id));
    },
  };
}

export async function getQueue(): Promise<QueueDriver> {
  if (!driverPromise) {
    driverPromise = (async () => (await sqliteDriver()) || fallbackDriver())();
  }
  return driverPromise;
}

export async function enqueueSubmit(attemptId: string, body: Record<string, unknown>) {
  const queue = await getQueue();
  const key = String(body.client_key || `${attemptId}-${body.exercise_id || "x"}`);
  return queue.enqueue({
    type: "submit",
    attempt_id: attemptId,
    idempotency_key: key,
    body: { ...body, client_key: key },
  });
}

export async function drainQueue(post: (path: string, init: RequestInit) => Promise<unknown>) {
  const queue = await getQueue();
  const rows = await queue.list();
  for (const row of rows) {
    try {
      await post("/sync/replay", {
        method: "POST",
        body: JSON.stringify([
          { type: row.type, attempt_id: row.attempt_id, body: row.body, client_key: row.idempotency_key },
        ]),
      });
      await queue.remove(row.id);
    } catch {
      break;
    }
  }
}
