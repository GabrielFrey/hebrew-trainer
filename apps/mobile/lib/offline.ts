import { drainWith, enqueueWith, fallbackDriver, type QueueDriver } from "./offline.shared";

export type { QueuedEvent, QueueDriver } from "./offline.shared";
export { newQueueId, fallbackDriver } from "./offline.shared";

let driverPromise: Promise<QueueDriver> | null = null;

export async function getQueue(): Promise<QueueDriver> {
  if (!driverPromise) driverPromise = Promise.resolve(fallbackDriver());
  return driverPromise;
}

export async function enqueueSubmit(attemptId: string, body: Record<string, unknown>) {
  return enqueueWith(await getQueue(), attemptId, body);
}

export async function drainQueue(post: (path: string, init: RequestInit) => Promise<unknown>) {
  return drainWith(await getQueue(), post);
}
