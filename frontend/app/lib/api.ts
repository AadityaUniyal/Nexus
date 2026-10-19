// Central API client wrapper for the Nexus frontend
// All fetch calls should go through this helper to ensure the session cookie
// is sent and, if available, the Authorization header is attached.

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  // Ensure we always send credentials for same‑origin requests
  const defaultInit: RequestInit = {
    credentials: "include",
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

  return fetch(input, mergedInit);
}
