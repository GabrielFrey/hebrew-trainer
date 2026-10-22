import * as SQLite from "expo-sqlite";
import {
  drainWith,
  enqueueWith,
  fallbackDriver,
  newQueueId,
  type QueueDriver,
  type QueuedEvent,
} from "./offline.shared";

export type { QueuedEvent, QueueDriver } from "./offline.shared";
export { fallbackDriver, newQueueId } from "./offline.shared";

let driverPromise: Promise<QueueDriver> | null = null;

async function sqliteDriver(): Promise<QueueDriver | null> {
  try {
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
        const row: QueuedEvent = { ...event, id: newQueueId(), created_at: new Date().toISOString() };
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

export async function getQueue(): Promise<QueueDriver> {
  if (!driverPromise) {
    driverPromise = (async () => (await sqliteDriver()) || fallbackDriver())();
  }
  return driverPromise;
}

export async function enqueueSubmit(attemptId: string, body: Record<string, unknown>) {
  return enqueueWith(await getQueue(), attemptId, body);
}

export async function drainQueue(post: (path: string, init: RequestInit) => Promise<unknown>) {
  return drainWith(await getQueue(), post);
}
