import { authFetch } from '../auth-fetch';

export const overviewApi = {
  getOverview: () => authFetch('/api/v1/overview'),
  getBriefing: () => authFetch('/api/v1/briefing'),
  explainBriefing: () => authFetch('/api/v1/briefing/explain', { method: 'POST' }),
};
