/** Thin typed client for the Biti Hebrew OpenAPI surface. Generated snapshots live in openapi.json. */

export const defaultBaseUrl = "http://127.0.0.1:43180";

export async function bitiFetch<T>(
  path: string,
  token?: string,
  init: RequestInit = {},
  base = defaultBaseUrl,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
