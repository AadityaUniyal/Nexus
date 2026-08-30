import { authFetch } from '../auth-fetch';

export const incidentsApi = {
  getIncidents: () => authFetch('/api/v1/incidents'),
  getIncident: (id: string) => authFetch(`/api/v1/incidents/${id}`),
  acknowledge: (id: string) => authFetch(`/api/v1/incidents/${id}/acknowledge`, { method: 'POST' }),
  startInvestigation: (id: string) => authFetch(`/api/v1/incidents/${id}/start-investigation`, { method: 'POST' }),
  resolve: (id: string) => authFetch(`/api/v1/incidents/${id}/resolve`, { method: 'POST' }),
  explainIncident: (id: string) => authFetch(`/api/v1/ai/explain`, { method: 'POST', body: JSON.stringify({ incidentId: id }) }),
};
