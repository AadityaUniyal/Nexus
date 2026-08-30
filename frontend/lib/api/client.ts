import { meApi } from './endpoints/me';
import { overviewApi } from './endpoints/overview';
import { worldApi } from './endpoints/world';
import { incidentsApi } from './endpoints/incidents';
import { simulationsApi } from './endpoints/simulations';
import { notificationsApi } from './endpoints/notifications';
import { adminApi } from './endpoints/admin';
import { locationApi } from './endpoints/location';

export const api = {
  me: meApi,
  overview: overviewApi,
  world: worldApi,
  incidents: incidentsApi,
  simulations: simulationsApi,
  notifications: notificationsApi,
  admin: adminApi,
  location: locationApi,
};

export default api;
