import { Platform } from "react-native";
import { newId } from "./id";

export type QueuedEvent = {
  id: string;
  idempotency_key: string;
  type: "submit";
  attempt_id: string;
  body: Record<string, unknown>;
  created_at: string;
};

export type QueueDriver = {
  backend: "sqlite" | "localStorage" | "memory";
  enqueue: (event: Omit<QueuedEvent, "id" | "created_at">) => Promise<QueuedEvent>;
  list: () => Promise<QueuedEvent[]>;
  remove: (id: string) => Promise<void>;
};

const MEMORY: QueuedEvent[] = [];
const LS_KEY = "biti-offline-queue";

export function newQueueId(): string {
  return newId("q");
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

export function fallbackDriver(): QueueDriver {
  return {
    backend: Platform.OS === "web" ? "localStorage" : "memory",
    async enqueue(event) {
      const rows = fromLocalStorage();
      const existing = rows.find((r) => r.idempotency_key === event.idempotency_key);
      if (existing) return existing;
      const row: QueuedEvent = { ...event, id: newQueueId(), created_at: new Date().toISOString() };
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

export async function enqueueWith(queue: QueueDriver, attemptId: string, body: Record<string, unknown>) {
  const key = String(body.client_key || `${attemptId}-${body.exercise_id || "x"}`);
  return queue.enqueue({
    type: "submit",
    attempt_id: attemptId,
    idempotency_key: key,
    body: { ...body, client_key: key },
  });
}

export async function drainWith(queue: QueueDriver, post: (path: string, init: RequestInit) => Promise<unknown>) {
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
