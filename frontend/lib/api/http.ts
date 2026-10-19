/** Shared transport for API requests. Authentication and tenant hints are added here once. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("X-Request-ID") && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    headers.set("X-Request-ID", crypto.randomUUID());
  }

  if (typeof window !== "undefined") {
    // Clerk sessions may use bearer tokens; Nexus password sessions use an HttpOnly cookie.
    if (!headers.has("Authorization")) {
      try {
        const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
        const token = await clerk?.session?.getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
      } catch {
        /* not signed in */
      }
    }

    try {
      const ws = localStorage.getItem("nexus_active_workspace_id");
      if (ws && !headers.has("X-Workspace-ID")) headers.set("X-Workspace-ID", ws);
    } catch {
      /* Workspace selection is optional; the server still resolves the default membership. */
    }
  }

  const apiBase = typeof window === "undefined"
    ? (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000")
    : "";
  const url = /^https?:\/\//i.test(path) ? path : `${apiBase}${path}`;
  return fetch(url, { ...init, headers, credentials: "include" });
}

export async function apiJson<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return (await res.json()) as T;
}
