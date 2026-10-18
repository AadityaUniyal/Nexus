/**
 * Thin fetch wrapper for /api/v1 calls that attaches the authenticated
 * session token and active workspace header.
 */
const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    // 1. Check verified local JWT access token
    const localToken = localStorage.getItem("nexus_access_token");
    if (localToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${localToken}`);
    }

    // 2. Check Clerk session token if available
    if (!headers.has("Authorization")) {
      try {
        const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
        const token = await clerk?.session?.getToken();
        if (token) headers.set("Authorization", `Bearer ${token}`);
      } catch {
        /* not signed in */
      }
    }

    // 3. Optional isolated demo mode strictly in non-production environments
    const isProd = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
    if (demoModeEnabled && !isProd && !headers.has("Authorization")) {
      const demoUser = localStorage.getItem("nexus_demo_user");
      if (demoUser || document.cookie.includes("nexus_demo_session")) {
        headers.set("Authorization", "Bearer demo-operator-token");
      }
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
