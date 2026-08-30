import { authFetch } from '../auth-fetch';

export const worldApi = {
  getSnapshot: () => authFetch('/api/v1/world/snapshot'),
};
