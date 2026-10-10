import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Zod schemas for runtime response validation
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  timezone: z.string(),
  locale: z.string(),
  distance_unit: z.enum(["km", "mi"]),
});

export const DriverSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  current_lat: z.number().nullable().optional(),
  current_lon: z.number().nullable().optional(),
  current_heading: z.number().nullable().optional(),
  last_ping_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export const StopSchema = z.object({
  id: z.string(),
  sequence: z.number(),
  stop_type: z.enum(["pickup", "dropoff"]),
  address: z.string(),
  lat: z.number(),
  lon: z.number(),
  tz: z.string(),
  window_start: z.string(),
  window_end: z.string(),
  status: z.string(),
  actual_arrival_at: z.string().nullable().optional(),
});

export const PredictionSchema = z.object({
  id: z.string(),
  status: z.enum(["on_time", "at_risk", "late", "unknown"]),
  eta_at: z.string().nullable().optional(),
  uncertainty_margin_seconds: z.number(),
  reason: z.string(),
}).nullable().optional();

export const RecommendationSchema = z.object({
  id: z.string(),
  action_type: z.string(),
  payload: z.record(z.any()),
  projected_eta_at: z.string(),
  status: z.string(),
});

export const JobSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  driver_id: z.string().nullable().optional(),
  title: z.string(),
  status: z.string(),
  version: z.number(),
  created_at: z.string(),
  stops: z.array(StopSchema),
  latest_prediction: PredictionSchema,
  active_recommendations: z.array(RecommendationSchema).optional(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  needs_onboarding: z.boolean(),
  role: z.string().optional(),
  workspace: WorkspaceSchema.nullable().optional(),
  memberships: z.array(z.any()).optional(),
});

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thin, typed, zod-validated API client with NO mock fallbacks (FR-2.3).
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>,
  customToken?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject auth token: either driver session token or Clerk session token
  if (customToken) {
    headers.set("Authorization", `Bearer ${customToken}`);
  } else if (typeof window !== "undefined") {
    try {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
    } catch {
      // Clerk session not yet initialized
    }
    const wsId = localStorage.getItem("nexus_workspace_id");
    if (wsId && !headers.has("X-Workspace-ID")) {
      headers.set("X-Workspace-ID", wsId);
    }
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const json = await response.json();
      errorDetail = json.detail || json.message || JSON.stringify(json);
    } catch {
      // Non-JSON error body
    }
    throw new ApiError(response.status, errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  if (schema) {
    return schema.parse(data);
  }
  return data as T;
}

export const api = {
  // User & Onboarding
  getMe: () => apiFetch("/api/v1/me", { method: "GET" }, UserProfileSchema),
  completeOnboarding: (data: { name: string; country: string; timezone: string; locale: string; distance_unit: "km" | "mi" }) =>
    apiFetch("/api/v1/onboarding", { method: "POST", body: JSON.stringify(data) }),

  // Workspace
  getWorkspace: () => apiFetch("/api/v1/workspaces/current", { method: "GET" }, WorkspaceSchema),
  updateWorkspace: (data: any) => apiFetch("/api/v1/workspaces/current", { method: "PATCH", body: JSON.stringify(data) }),
  getWorkspaceMembers: () => apiFetch<any[]>("/api/v1/workspaces/members", { method: "GET" }),
  createWorkspaceInvite: (data: { role: string; expires_in_hours: number }) =>
    apiFetch<{ invite_code: string; expires_at: string }>("/api/v1/workspaces/invites", { method: "POST", body: JSON.stringify(data) }),

  // Drivers
  getDrivers: () => apiFetch("/api/v1/drivers", { method: "GET" }, z.array(DriverSchema)),
  getDriver: (id: string) => apiFetch(`/api/v1/drivers/${id}`, { method: "GET" }, DriverSchema),
  createDriver: (data: { name: string; phone?: string }) =>
    apiFetch("/api/v1/drivers", { method: "POST", body: JSON.stringify(data) }, DriverSchema),
  updateDriver: (id: string, data: any) =>
    apiFetch(`/api/v1/drivers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDriver: (id: string) =>
    apiFetch(`/api/v1/drivers/${id}`, { method: "DELETE" }),
  generateDriverLink: (id: string) =>
    apiFetch<{ driver_id: string; link_token: string; expires_at: string }>(`/api/v1/drivers/${id}/link`, { method: "POST" }),
  revokeDriverSessions: (id: string) =>
    apiFetch(`/api/v1/drivers/${id}/revoke-session`, { method: "POST" }),

  // Jobs
  getJobs: () => apiFetch("/api/v1/jobs", { method: "GET" }, z.array(JobSchema)),
  getJob: (id: string) => apiFetch(`/api/v1/jobs/${id}`, { method: "GET" }, JobSchema),
  createJob: (data: any) => apiFetch<{ status: string; job_id: string }>("/api/v1/jobs", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id: string, data: any) =>
    apiFetch(`/api/v1/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  previewRoute: (origin_lat: number, origin_lon: number, dest_lat: number, dest_lon: number) =>
    apiFetch<any>("/api/v1/jobs/preview-route", {
      method: "POST",
      body: JSON.stringify({ origin_lat, origin_lon, dest_lat, dest_lon }),
    }),

  // Maps
  getMapsToken: () => apiFetch<{ token: string; clientId: string; expiresIn: number; expiresAt: string }>("/api/v1/maps/token", { method: "GET" }),
  searchGeo: (query: string) => apiFetch<any[]>(`/api/v1/geo/search?query=${encodeURIComponent(query)}`, { method: "GET" }),

  // Recommendations
  approveRecommendation: (recId: string) =>
    apiFetch(`/api/v1/recommendations/${recId}/approve`, { method: "POST" }),

  // Analytics & Audit
  getAnalytics: () => apiFetch<any>("/api/v1/analytics", { method: "GET" }),
  getAuditLogs: () => apiFetch<any[]>("/api/v1/audit", { method: "GET" }),
  verifyAuditChain: () => apiFetch<{ valid: boolean; checked: number; first_broken_seq: number | null }>("/api/v1/audit/verify", { method: "GET" }),

  // Driver PWA Portal (Session-Auth)
  driverRedeem: (linkToken: string, deviceInfo?: string) =>
    apiFetch<any>("/api/v1/driver/redeem", {
      method: "POST",
      body: JSON.stringify({ link_token: linkToken, device_info: deviceInfo }),
    }),
  driverDuty: (status: "on_duty" | "off_duty", token: string) =>
    apiFetch<any>("/api/v1/driver/duty", { method: "POST", body: JSON.stringify({ status }) }, undefined, token),
  driverSendPings: (pings: any[], token: string) =>
    apiFetch<any>("/api/v1/driver/pings", { method: "POST", body: JSON.stringify({ pings }) }, undefined, token),
  driverGetActiveJob: (token: string) =>
    apiFetch<any>("/api/v1/driver/active-job", { method: "GET" }, undefined, token),
  driverStopAction: (action: "start" | "arrived" | "delivered", stopId: string, recordedAt: string, token: string, lat?: number, lon?: number) =>
    apiFetch<any>("/api/v1/driver/actions/stop", {
      method: "POST",
      body: JSON.stringify({ action, stop_id: stopId, recorded_at: recordedAt, lat, lon }),
    }, undefined, token),
};
