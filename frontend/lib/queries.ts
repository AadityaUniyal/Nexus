import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
  });
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => api.getWorkspace(),
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: () => api.getDrivers(),
    refetchInterval: 10000,
  });
}

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.getJobs(),
    refetchInterval: 10000,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.getAnalytics(),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.getAuditLogs(),
  });
}

export function useAuditVerification() {
  return useQuery({
    queryKey: ["audit-verification"],
    queryFn: () => api.verifyAuditChain(),
  });
}
