import { authFetch } from '../auth-fetch';

export const simulationsApi = {
  getSimulations: () => authFetch('/api/v1/simulations'),
  getSimulation: (id: string) => authFetch(`/api/v1/simulations/${id}`),
  createSimulation: (data: any) => authFetch('/api/v1/simulations', { method: 'POST', body: JSON.stringify(data) }),
  runSimulation: (id: string) => authFetch(`/api/v1/simulations/${id}/run`, { method: 'POST' }),
  applyDecision: (id: string, notes?: string) =>
    authFetch(`/api/v1/simulations/${id}/apply-decision`, {
      method: 'POST',
      body: JSON.stringify({ simulationId: id, operatorNotes: notes }),
    }),
};
