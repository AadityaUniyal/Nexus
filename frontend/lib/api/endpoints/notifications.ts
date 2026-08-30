import { authFetch } from '../auth-fetch';

export const notificationsApi = {
  getNotifications: () => authFetch('/api/v1/notifications'),
  markAsRead: (id: string) => authFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
  readAll: () => authFetch('/api/v1/notifications/read-all', { method: 'POST' }),
};
