/**
 * Thin fetch wrapper for same-origin /api/v1 calls that attaches the Clerk
 * session token and active workspace header. Returns the raw Response so
 * callers can stream blobs (CSV export) or parse JSON as needed.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    try {
      const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
      const token = await clerk?.session?.getToken();
      if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    } catch {
      /* not signed in */
    }
    const ws = localStorage.getItem("nexus_active_workspace_id");
    if (ws && !headers.has("X-Workspace-ID")) headers.set("X-Workspace-ID", ws);
  }
  return fetch(path, { ...init, headers });
}

export async function apiJson<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return (await res.json()) as T;
}
