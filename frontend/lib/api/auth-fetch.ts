import { NexusApiError, ApiErrorDetail } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export async function authFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // If running in browser and Clerk session token exists in cookie or localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nexus_clerk_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
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
