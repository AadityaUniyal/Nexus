// Central API client wrapper for the Nexus frontend
// All fetch calls should go through this helper to ensure the session cookie
// is sent and, if available, the Authorization header is attached.

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  // Ensure we always send credentials for same‑origin requests
  const defaultInit: RequestInit = {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Merge user‑provided init with defaults (user values win)
  const mergedInit: RequestInit = {
    ...defaultInit,
    ...init,
    headers: {
      ...(defaultInit.headers as Record<string, string>),
      ...(init.headers as Record<string, string>),
    },
  };

  // If a token exists in localStorage, include it as a Bearer header.
  // This is optional because the backend also reads the session cookie.
  try {
    const token = typeof window !== "undefined" && localStorage.getItem("nexus_access_token");
    if (token) {
      (mergedInit.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // ignore errors during SSR where window is undefined
  }

  return fetch(input, mergedInit);
}
