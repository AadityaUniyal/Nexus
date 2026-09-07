import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiNexusDataProvider, MockNexusDataProvider } from './data-provider';

// Create a single instance of the data provider
const dataProvider = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
  ? new MockNexusDataProvider()
  : new ApiNexusDataProvider();

export function useOverviewStats() {
  return useQuery({ queryKey: ['overview-stats'], queryFn: () => dataProvider.getOverviewStats() });
}

export function useVehicles() {
  return useQuery({ queryKey: ['vehicles'], queryFn: () => dataProvider.getVehicles() });
}

export function useVehicle(id: string) {
  return useQuery({ queryKey: ['vehicle', id], queryFn: () => dataProvider.getVehicle(id), enabled: !!id });
}

export function useWarehouses() {
  return useQuery({ queryKey: ['warehouses'], queryFn: () => dataProvider.getWarehouses() });
}

export function useRoutes() {
  return useQuery({ queryKey: ['routes'], queryFn: () => dataProvider.getRoutes() });
}

export function useRoute(id: string) {
  return useQuery({ queryKey: ['route', id], queryFn: () => dataProvider.getRoute(id), enabled: !!id });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: () => dataProvider.getOrders() });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => dataProvider.getOrder(id), enabled: !!id });
}

export function useIncidents(severity?: string) {
  return useQuery({ queryKey: ['incidents', severity], queryFn: () => dataProvider.getIncidents(severity) });
}

export function useIncident(id: string) {
  return useQuery({ queryKey: ['incident', id], queryFn: () => dataProvider.getIncident(id), enabled: !!id });
}

export function useSimulations() {
  return useQuery({ queryKey: ['simulations'], queryFn: () => dataProvider.getSimulations() });
}

export function useSimulation(id: string) {
  return useQuery({ queryKey: ['simulation', id], queryFn: () => dataProvider.getSimulation(id), enabled: !!id });
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: () => dataProvider.getNotifications() });
}

export function useAuditLogs() {
  return useQuery({ queryKey: ['audit-logs'], queryFn: () => dataProvider.getAuditLogs() });
}

export function usePipelineHealth() {
  return useQuery({ queryKey: ['pipeline-health'], queryFn: () => dataProvider.getPipelineHealth() });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => dataProvider.getUsers() });
}

export function useUser(id: string) {
  return useQuery({ queryKey: ['user', id], queryFn: () => dataProvider.getUser(id), enabled: !!id });
}

export function useEvents() {
  return useQuery({ queryKey: ['events'], queryFn: () => dataProvider.getEvents() });
}
