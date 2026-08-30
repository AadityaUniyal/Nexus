import { authFetch } from '../auth-fetch';

export const adminApi = {
  getOverview: () => authFetch('/api/v1/admin/overview'),
  getUsers: () => authFetch('/api/v1/admin/users'),
  getUser: (id: string) => authFetch(`/api/v1/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    authFetch(`/api/v1/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  getAuditLogs: () => authFetch('/api/v1/admin/audit'),
  getPipeline: () => authFetch('/api/v1/admin/pipeline'),
  getSystemHealth: () => authFetch('/api/v1/admin/system-health'),
  getIntegrations: () => authFetch('/api/v1/admin/integrations'),
  testIntegration: (provider: string) =>
    authFetch(`/api/v1/admin/integrations/${provider}/test`, { method: 'POST' }),
};
