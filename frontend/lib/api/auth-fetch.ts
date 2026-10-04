import { NexusApiError, ApiErrorDetail } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const demoModeEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';

export async function authFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // If running in browser, inject active Clerk session token
  if (typeof window !== 'undefined') {
    if (!headers.has('Authorization')) {
      try {
        const clerk = (window as any).Clerk;
        if (clerk?.session) {
          const token = await clerk.session.getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        }
      } catch (e) {
        // Clerk session token unavailable or not initialized yet
      }
      if (demoModeEnabled && !headers.has('Authorization')) {
        const demoUser = localStorage.getItem('nexus_demo_user');
        if (demoUser || document.cookie.includes('nexus_demo_session')) {
          headers.set('Authorization', 'Bearer demo-operator-token');
        }
      }
    }
    const workspaceId = localStorage.getItem('nexus_active_workspace_id');
    if (workspaceId && !headers.has('X-Workspace-ID')) {
      headers.set('X-Workspace-ID', workspaceId);
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorJson: { error?: ApiErrorDetail } = {};
      try {
        errorJson = await response.json();
      } catch {
        errorJson = {
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'API Request failed',
          },
        };
      }
      throw new NexusApiError(
        response.status,
        errorJson.error || {
          code: `HTTP_${response.status}`,
          message: 'An error occurred during request',
        }
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err) {
    if (err instanceof NexusApiError) {
      throw err;
    }
    throw new NexusApiError(0, {
      code: 'NETWORK_ERROR',
      message: (err as Error).message || 'Unable to connect to NEXUS server',
    });
  }
}
