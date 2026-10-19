import { NexusApiError, ApiErrorDetail } from './errors';
import { apiFetch } from './http';

export async function authFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await apiFetch(path, options);

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
