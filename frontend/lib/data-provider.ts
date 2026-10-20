import type {
  WarehouseItem, VehicleItem, RouteItem, OrderItem, IncidentItem, SimulationItem,
  NotificationItem, OperationalEventItem, AuditLogItem, UserItem, PipelineHealthItem,
} from "./mock-data";
import { apiFetch } from "@/lib/api/http";

export interface OverviewStats {
  totalVehicles: number;
  activeVehicles: number;
  totalWarehouses: number;
  activeIncidents: number;
  totalOrders: number;
  delayedOrders: number;
  slaCompliance: number | null;
  fleetUtilization: number | null;
  networkEfficiency: number | null;
  activeSimulations: number;
  unreadNotifications: number;
}

export interface NexusDataProvider {
  getOverviewStats(): Promise<OverviewStats>;
  getVehicles(): Promise<VehicleItem[]>;
  getVehicle(id: string): Promise<VehicleItem | null>;
  createVehicle(data: Partial<VehicleItem>): Promise<VehicleItem>;
  updateVehicle(id: string, data: Partial<VehicleItem>): Promise<VehicleItem>;
  deleteVehicle(id: string): Promise<void>;
  getWarehouses(): Promise<WarehouseItem[]>;
  createWarehouse(data: Partial<WarehouseItem>): Promise<WarehouseItem>;
  updateWarehouse(id: string, data: Partial<WarehouseItem>): Promise<WarehouseItem>;
  deleteWarehouse(id: string): Promise<void>;
  getRoutes(): Promise<RouteItem[]>;
  getRoute(id: string): Promise<RouteItem | null>;
  createRoute(data: Partial<RouteItem>): Promise<RouteItem>;
  updateRoute(id: string, data: Partial<RouteItem>): Promise<RouteItem>;
  deleteRoute(id: string): Promise<void>;
  provisionPreset(presetKey: "dehradun" | "delhi" | "london" | "tokyo" | "chicago"): Promise<{ warehouses: WarehouseItem[]; vehicles: VehicleItem[] }>;
  getOrders(): Promise<OrderItem[]>;
  getOrder(id: string): Promise<OrderItem | null>;
  createOrder(data: Partial<OrderItem>): Promise<OrderItem>;
  updateOrder(id: string, data: Partial<OrderItem>): Promise<OrderItem>;
  deleteOrder(id: string): Promise<void>;
  getIncidents(severity?: string): Promise<IncidentItem[]>;
  getIncident(id: string): Promise<IncidentItem | null>;
  createIncident(data: Partial<IncidentItem>): Promise<IncidentItem>;
  transitionIncident(id: string, status: string, note: string, actorName?: string): Promise<IncidentItem>;
  getSimulations(): Promise<SimulationItem[]>;
  getSimulation(id: string): Promise<SimulationItem | null>;
  createSimulation(data: any): Promise<SimulationItem>;
  applyDecision(simId: string, actorName?: string): Promise<SimulationItem>;
  getNotifications(): Promise<NotificationItem[]>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  getAuditLogs(): Promise<AuditLogItem[]>;
  getPipelineHealth(): Promise<PipelineHealthItem[]>;
  getUsers(): Promise<UserItem[]>;
  getUser(id: string): Promise<UserItem | null>;
  updateUserRole(id: string, role: string): Promise<UserItem>;
  getEvents(): Promise<OperationalEventItem[]>;
  submitContact(data: any): Promise<void>;
  submitFeedback(data: any): Promise<void>;
  getProfile(): Promise<any>;
  updateProfile(data: any): Promise<any>;
  getSettings(): Promise<any>;
  updateSettings(data: any): Promise<any>;
}

export interface QueuedMutationItem {
  id: string;
  path: string;
  method: string;
  body?: string;
  enqueuedAt: number;
  attempts: number;
  lastError?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

/**
 * Non-blocking client-side mutation buffer and rate-limit retry engine.
 * Buffers mutations in local memory and localStorage to survive network drops.
 * Retries on HTTP 429 (Azure free tier rate limit) and transient network drops
 * using exponential backoff with jitter and Retry-After header parsing.
 * Enforces ZERO mock fallbacks: if retries exhaust, actionable diagnostics bubble up.
 */
export class OfflineMutationBuffer {
  private queue: QueuedMutationItem[] = [];
  private maxRetries: number = 3;
  private baseDelayMs: number = 400;
  private maxDelayMs: number = 4000;
  private listeners: Set<(items: QueuedMutationItem[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem("nexus_offline_mutation_buffer");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.queue = parsed;
          }
        }
      } catch {
        // Ignore JSON or storage errors
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const persistable = this.queue.filter((item) => item.status === "pending" || item.status === "processing");
        localStorage.setItem("nexus_offline_mutation_buffer", JSON.stringify(persistable));
      } catch {
        // Storage quota exceeded or disabled
      }
    }
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener([...this.queue]);
      } catch {
        // Ignore subscriber errors
      }
    }
  }

  public subscribe(listener: (items: QueuedMutationItem[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.queue]);
    return () => this.listeners.delete(listener);
  }

  public getPending(): QueuedMutationItem[] {
    return this.queue.filter((i) => i.status === "pending" || i.status === "processing");
  }

  public getQueue(): QueuedMutationItem[] {
    return [...this.queue];
  }

  public clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Executes a mutation through the non-blocking retry queue with exponential backoff and jitter.
   * On network drops or HTTP 429 rate limits, it buffers and retries up to maxRetries.
   * If retries are exhausted, errors bubble up with actionable diagnostics. Zero mock fallbacks.
   */
  public async executeMutation<T>(
    path: string,
    options: RequestInit,
    fetchFn: (path: string, options: RequestInit) => Promise<Response>
  ): Promise<T> {
    const method = (options.method || "POST").toUpperCase();
    const itemId = `mut-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const bufferItem: QueuedMutationItem = {
      id: itemId,
      path,
      method,
      body: typeof options.body === "string" ? options.body : undefined,
      enqueuedAt: Date.now(),
      attempts: 0,
      status: "pending",
    };

    this.queue.push(bufferItem);
    this.saveToStorage();

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      bufferItem.attempts = attempt + 1;
      bufferItem.status = "processing";
      this.saveToStorage();

      try {
        const res = await fetchFn(path, options);

        if (res.ok) {
          bufferItem.status = "completed";
          this.queue = this.queue.filter((i) => i.id !== itemId);
          this.saveToStorage();

          const json = await res.json().catch(() => ({}));
          if (json && typeof json === "object" && "data" in json && (json.success === true || json.data !== undefined)) {
            return json.data as T;
          }
          return json as T;
        }

        // Check for 429 Rate Limiting or transient 502/503/504
        if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
          const retryAfterHeader = res.headers.get("Retry-After");
          let delayMs = 0;
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed) && parsed > 0) {
              delayMs = parsed * 1000;
            }
          }
          if (delayMs <= 0) {
            const backoff = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, attempt));
            const jitter = Math.random() * 200;
            delayMs = backoff + jitter;
          }

          const errBody = await res.json().catch(() => ({}));
          const errMsg = errBody?.error?.message || errBody?.detail || `HTTP_${res.status}`;
          bufferItem.lastError = `HTTP ${res.status}: ${errMsg}`;

          if (attempt < this.maxRetries) {
            console.warn(`[MutationBuffer] HTTP ${res.status} on ${method} ${path}. Retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${this.maxRetries})...`);
            await new Promise((r) => setTimeout(r, delayMs));
            attempt++;
            continue;
          }

          bufferItem.status = "failed";
          this.saveToStorage();
          throw new Error(`[Mutation Failed after ${this.maxRetries + 1} attempts]: HTTP ${res.status} (${errMsg}). Operational changes require an active cloud connection.`);
        }

        // Non-retriable client errors (400, 401, 403, 404, 409, 422)
        bufferItem.status = "failed";
        this.queue = this.queue.filter((i) => i.id !== itemId);
        this.saveToStorage();
        const clientErr = await res.json().catch(() => ({}));
        throw new Error(clientErr?.error?.message || clientErr?.detail || `HTTP_${res.status}`);

      } catch (err: any) {
        // If it's already a failed status or non-network rethrown error, bubble up immediately
        if (bufferItem.status === "failed") {
          throw err;
        }

        // Network connection error / offline
        bufferItem.lastError = err?.message || "Network request failed";
        if (attempt < this.maxRetries) {
          const backoff = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, attempt));
          const jitter = Math.random() * 200;
          const delayMs = backoff + jitter;
          console.warn(`[MutationBuffer] Network error on ${method} ${path}: ${err?.message}. Retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${this.maxRetries})...`);
          await new Promise((r) => setTimeout(r, delayMs));
          attempt++;
          continue;
        }

        bufferItem.status = "failed";
        this.saveToStorage();
        throw new Error(`[Mutation Failed after ${this.maxRetries + 1} attempts]: Network unreachable (${err?.message || "Offline"}). Mutation could not be persisted.`);
      }
    }

    throw new Error("Mutation could not be executed");
  }
}

export const mutationBuffer = new OfflineMutationBuffer();

/**
 * Authoritative API Data Provider connected directly to FastAPI & PostgreSQL.
 * Errors propagate without silent mock fallbacks so callers handle genuine operational states.
 */
export class ApiNexusDataProvider implements NexusDataProvider {
  private async fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || "GET").toUpperCase();
    const isMutation = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

    if (isMutation) {
      return mutationBuffer.executeMutation<T>(path, options, (p, o) => apiFetch(p, o));
    }

    const res = await apiFetch(path, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.detail || `HTTP_${res.status}`);
    }
    const json = await res.json();
    if (json && typeof json === "object" && "data" in json && (json.success === true || json.data !== undefined)) {
      return json.data as T;
    }
    return json as T;
  }

  async getOverviewStats(): Promise<OverviewStats> {
    const response = await this.fetchApi<{ stats?: Record<string, number | null> }>("/api/v1/overview");
    const stats = response?.stats;
    if (!stats) throw new Error("Overview service returned an invalid response.");
    return {
      totalVehicles: stats.totalVehicles ?? 0,
      activeVehicles: stats.activeVehicles ?? 0,
      totalWarehouses: stats.totalWarehouses ?? 0,
      activeIncidents: stats.activeIncidents ?? 0,
      totalOrders: stats.totalOrders ?? 0,
      delayedOrders: stats.delayedOrders ?? 0,
      slaCompliance: stats.slaCompliance ?? null,
      fleetUtilization: stats.fleetUtilization ?? null,
      networkEfficiency: stats.networkEfficiency ?? null,
      activeSimulations: stats.activeSimulations ?? 0,
      unreadNotifications: stats.unreadNotifications ?? 0,
    };
  }

  async getVehicles(): Promise<VehicleItem[]> {
    const rows = await this.fetchApi<any[]>("/api/v1/operations/vehicles");
    if (!Array.isArray(rows)) throw new Error("Vehicle service returned an invalid response.");
    return rows.map((v) => ({
      id: v.id, code: v.code, name: v.name, model: v.model ?? "",
      driverName: v.driver_name ?? "", driverPhone: v.driver_phone ?? "",
      capacityKg: v.capacity_kg ?? null, currentLoadKg: v.current_load_kg ?? null,
      status: v.status, lat: v.current_lat ?? null, lng: v.current_lng ?? null,
      heading: v.heading ?? null, speedKmh: v.speed_kmh ?? null,
      batteryPct: v.battery_pct ?? null, healthScore: v.health_score ?? null,
      currentRouteId: v.current_route_id ?? null, currentRouteName: v.current_route_name ?? "",
    } as VehicleItem));
  }
  async createVehicle(data: Partial<VehicleItem>): Promise<VehicleItem> {
    if (!data.code?.trim() || !data.name?.trim() || !data.model?.trim() || !data.driverName?.trim() || data.lat == null || data.lng == null) {
      throw new Error("Vehicle code, name, model, driver, and current coordinates are required.");
    }
    const row = await this.fetchApi<any>("/api/v1/operations/vehicles", { method: "POST", body: JSON.stringify({
      code: data.code, name: data.name, model: data.model, driver_name: data.driverName,
      current_lat: data.lat, current_lng: data.lng, speed_kmh: data.speedKmh,
      battery_pct: data.batteryPct, health_score: data.healthScore, status: data.status,
      current_route_id: data.currentRouteId, current_route_name: data.currentRouteName,
    }) });
    return { id: row.id, code: row.code, name: row.name, model: row.model, driverName: row.driver_name,
      driverPhone: "", capacityKg: null as any, currentLoadKg: null as any, status: row.status,
      lat: row.current_lat, lng: row.current_lng, heading: null as any, speedKmh: row.speed_kmh,
      batteryPct: row.battery_pct, healthScore: row.health_score, currentRouteId: row.current_route_id,
      currentRouteName: row.current_route_name ?? "" };
  }
  async updateVehicle(id: string, data: Partial<VehicleItem>): Promise<VehicleItem> {
    const list = await this.getVehicles();
    const existing = list.find((v) => v.id === id || v.code === id);
    const updated: VehicleItem = {
      ...(existing || {} as VehicleItem),
      ...data,
      id: existing?.id || id,
      code: data.code || existing?.code || id,
    };



    try {
      await this.fetchApi(`/api/v1/operations/vehicles/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          code: updated.code,
          name: updated.name,
          model: updated.model,
          driver_name: updated.driverName,
          current_lat: updated.lat,
          current_lng: updated.lng,
          speed_kmh: updated.speedKmh,
          battery_pct: updated.batteryPct,
          health_score: updated.healthScore,
          status: updated.status,
        }),
      });
    } catch (err) {
      throw err;
    }

    return updated;
  }

  async deleteVehicle(id: string): Promise<void> {


    try {
      await this.fetchApi(`/api/v1/operations/vehicles/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      throw err;
    }
  }

  async getVehicle(id: string): Promise<VehicleItem | null> {
    const list = await this.getVehicles();
    return list.find((v) => v.id === id || v.code === id) || null;
  }

  async getWarehouses(): Promise<WarehouseItem[]> {
    const rows = await this.fetchApi<any[]>("/api/v1/operations/warehouses");
    if (!Array.isArray(rows)) throw new Error("Warehouse service returned an invalid response.");
    return rows.map((w) => ({
      id: w.id, code: w.code, name: w.name, city: w.city, state: w.state,
      lat: w.lat ?? null, lng: w.lng ?? null, capacityUnits: w.capacity_units ?? null,
      currentUnits: w.current_units ?? null, dockCount: w.dock_count ?? null,
      activeDocks: w.active_docks ?? null, efficiencyPct: w.efficiency_pct ?? null,
      status: w.status, createdAt: w.created_at ?? null,
    } as WarehouseItem));
  }
  async createWarehouse(data: Partial<WarehouseItem>): Promise<WarehouseItem> {
    if (!data.code?.trim() || !data.name?.trim() || !data.city?.trim() || !data.state?.trim() || data.lat == null || data.lng == null || data.capacityUnits == null || data.currentUnits == null || data.dockCount == null || data.activeDocks == null || data.efficiencyPct == null) {
      throw new Error("Complete location, capacity, inventory, dock, and measured efficiency fields before saving.");
    }
    const row = await this.fetchApi<any>("/api/v1/operations/warehouses", { method: "POST", body: JSON.stringify({
      code: data.code, name: data.name, city: data.city, state: data.state, lat: data.lat, lng: data.lng,
      capacity_units: data.capacityUnits, current_units: data.currentUnits, dock_count: data.dockCount,
      active_docks: data.activeDocks, efficiency_pct: data.efficiencyPct, status: data.status,
    }) });
    return { id: row.id, code: row.code, name: row.name, city: row.city, state: row.state, lat: row.lat,
      lng: row.lng, capacityUnits: row.capacity_units, currentUnits: row.current_units, dockCount: row.dock_count,
      activeDocks: row.active_docks, efficiencyPct: row.efficiency_pct, status: row.status, createdAt: row.created_at };
  }
  async updateWarehouse(id: string, data: Partial<WarehouseItem>): Promise<WarehouseItem> {
    const list = await this.getWarehouses();
    const existing = list.find((w) => w.id === id || w.code === id);
    const updated: WarehouseItem = {
      ...(existing || {} as WarehouseItem),
      ...data,
      id: existing?.id || id,
      code: data.code || existing?.code || id,
    };



    try {
      await this.fetchApi(`/api/v1/operations/warehouses/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          code: updated.code,
          name: updated.name,
          city: updated.city,
          state: updated.state,
          lat: updated.lat,
          lng: updated.lng,
          capacity_units: updated.capacityUnits,
          current_units: updated.currentUnits,
          dock_count: updated.dockCount,
          active_docks: updated.activeDocks,
          efficiency_pct: updated.efficiencyPct,
          status: updated.status,
        }),
      });
    } catch (err) {
      throw err;
    }

    return updated;
  }

  async deleteWarehouse(id: string): Promise<void> {


    try {
      await this.fetchApi(`/api/v1/operations/warehouses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      throw err;
    }
  }

  async createRoute(data: Partial<RouteItem>): Promise<RouteItem> {
    if (!data.code?.trim() || !data.name?.trim() || !data.originWarehouseId || !data.destWarehouseId || !data.originWarehouseName || !data.destWarehouseName || data.distanceKm == null || data.avgDurationMins == null) {
      throw new Error("Route identifiers, both workspace locations, distance, and duration are required.");
    }
    const row = await this.fetchApi<any>("/api/v1/operations/routes", { method: "POST", body: JSON.stringify({
      code: data.code, name: data.name, origin_warehouse_id: data.originWarehouseId,
      origin_warehouse_name: data.originWarehouseName, dest_warehouse_id: data.destWarehouseId,
      dest_warehouse_name: data.destWarehouseName, distance_km: data.distanceKm,
      avg_duration_mins: data.avgDurationMins, traffic_condition: data.trafficCondition, waypoints: data.waypoints ?? [],
    }) });
    return { id: row.id, code: row.code, name: row.name, originWarehouseId: row.origin_warehouse_id,
      originWarehouseName: row.origin_warehouse_name, destWarehouseId: row.dest_warehouse_id,
      destWarehouseName: row.dest_warehouse_name, distanceKm: row.distance_km, avgDurationMins: row.avg_duration_mins,
      riskScore: row.risk_score ?? null as any, trafficCondition: row.traffic_condition, waypoints: row.waypoints ?? [] };
  }
  async updateRoute(id: string, data: Partial<RouteItem>): Promise<RouteItem> {
    const list = await this.getRoutes();
    const existing = list.find((r) => r.id === id || r.code === id);
    const updated: RouteItem = {
      ...(existing || {} as RouteItem),
      ...data,
      id: existing?.id || id,
      code: data.code || existing?.code || id,
    };



    try {
      await this.fetchApi(`/api/v1/operations/routes/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          code: updated.code,
          name: updated.name,
          origin_warehouse_id: updated.originWarehouseId,
          origin_warehouse_name: updated.originWarehouseName,
          dest_warehouse_id: updated.destWarehouseId,
          dest_warehouse_name: updated.destWarehouseName,
          distance_km: updated.distanceKm,
          avg_duration_mins: updated.avgDurationMins,
          traffic_condition: updated.trafficCondition,
          waypoints: updated.waypoints,
        }),
      });
    } catch (err) {
      throw err;
    }

    return updated;
  }

  async deleteRoute(id: string): Promise<void> {


    try {
      await this.fetchApi(`/api/v1/operations/routes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      throw err;
    }
  }

  async provisionPreset(): Promise<{ warehouses: WarehouseItem[]; vehicles: VehicleItem[] }> {
    throw new Error("Preset records are not available. Import or enter your workspace's real operational data.");
  }

  async getRoutes(): Promise<RouteItem[]> {
    const rows = await this.fetchApi<any[]>("/api/v1/operations/routes");
    if (!Array.isArray(rows)) throw new Error("Route service returned an invalid response.");
    return rows.map((r) => ({
      id: r.id, code: r.code, name: r.name, originWarehouseId: r.origin_warehouse_id,
      originWarehouseName: r.origin_warehouse_name ?? "", destWarehouseId: r.dest_warehouse_id,
      destWarehouseName: r.dest_warehouse_name ?? "", distanceKm: r.distance_km ?? null,
      avgDurationMins: r.avg_duration_mins ?? null, riskScore: r.risk_score ?? null,
      trafficCondition: r.traffic_condition ?? null, waypoints: r.waypoints ?? [],
    } as RouteItem));
  }
  async getRoute(id: string): Promise<RouteItem | null> {
    try {
      const r = await this.fetchApi<any>(`/api/v1/operations/routes/${id}`);
      if (!r) return null;
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        originWarehouseId: r.origin_warehouse_id,
        originWarehouseName: r.origin_warehouse_name,
        destWarehouseId: r.dest_warehouse_id,
        destWarehouseName: r.dest_warehouse_name,
        distanceKm: r.distance_km,
        avgDurationMins: r.avg_duration_mins,
        riskScore: r.risk_score ?? null,
        trafficCondition: (r.traffic_condition as any) || null,
        waypoints: r.waypoints || [],
      };
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("NOT_FOUND")) {
        return null;
      }
      throw err;
    }
  }

  async getOrders(): Promise<OrderItem[]> {
    const rows = await this.fetchApi<any[]>("/api/v1/operations/orders");
    if (!Array.isArray(rows)) throw new Error("Order service returned an invalid response.");
    return rows.map((o) => ({
      id: o.id, orderNumber: o.order_number, customerName: o.customer_name,
      destination: o.destination, priority: o.priority, status: o.status,
      warehouseId: o.warehouse_id ?? null, warehouseName: o.warehouse_name ?? "",
      routeId: o.route_id ?? null, routeName: o.route_name ?? "",
      vehicleId: o.vehicle_id ?? null, vehicleCode: o.vehicle_code ?? "",
      deadline: o.deadline ?? "", estimatedEta: o.estimated_eta ?? "",
      itemsCount: o.items_count ?? null, totalCost: o.total_cost ?? null,
      slaCompliant: o.sla_compliant ?? null,
    } as OrderItem));
  }
  async getOrder(id: string): Promise<OrderItem | null> {
    try {
      const o = await this.fetchApi<any>(`/api/v1/operations/orders/${id}`);
      if (!o) return null;
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        destination: o.destination,
        priority: o.priority,
        status: o.status,
        warehouseId: o.warehouse_id || null,
        warehouseName: o.warehouse_name ?? "",
        routeId: o.route_id || null,
        routeName: o.route_name ?? "",
        vehicleId: o.vehicle_id || null,
        vehicleCode: o.vehicle_code ?? "",
        deadline: o.deadline,
        estimatedEta: o.estimated_eta ?? "",
        itemsCount: o.items_count ?? null,
        totalCost: o.total_cost ?? null,
        slaCompliant: o.sla_compliant ?? null,
      };
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("NOT_FOUND")) {
        return null;
      }
      throw err;
    }
  }

  async createOrder(data: Partial<OrderItem>): Promise<OrderItem> {
    if (!data.orderNumber?.trim() || !data.customerName?.trim() || !data.destination?.trim() || !data.deadline || data.totalCost == null) {
      throw new Error("Order number, customer, destination, deadline, and declared cost are required.");
    }
    const row = await this.fetchApi<any>("/api/v1/operations/orders", { method: "POST", body: JSON.stringify({
      order_number: data.orderNumber, customer_name: data.customerName, destination: data.destination,
      priority: data.priority, status: data.status, total_cost: data.totalCost, deadline: data.deadline,
      warehouse_id: data.warehouseId, route_id: data.routeId,
      vehicle_id: data.vehicleId, vehicle_code: data.vehicleCode,
    }) });
    return { id: row.id, orderNumber: row.order_number, customerName: row.customer_name, destination: row.destination,
      priority: row.priority, status: row.status, warehouseId: row.warehouse_id ?? null, warehouseName: row.warehouse_name ?? "",
      routeId: row.route_id ?? null, routeName: row.route_name ?? "", vehicleId: row.vehicle_id ?? null,
      vehicleCode: row.vehicle_code ?? "", deadline: row.deadline, estimatedEta: row.estimated_eta ?? "",
      itemsCount: row.items_count ?? null as any, totalCost: row.total_cost, slaCompliant: row.sla_compliant ?? null as any };
  }
  async updateOrder(id: string, data: Partial<OrderItem>): Promise<OrderItem> {
    const list = await this.getOrders();
    const existing = list.find((o) => o.id === id || o.orderNumber === id);
    const updated: OrderItem = {
      ...(existing || {} as OrderItem),
      ...data,
      id: existing?.id || id,
      orderNumber: data.orderNumber || existing?.orderNumber || id,
    };



    try {
      await this.fetchApi(`/api/v1/operations/orders/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          order_number: updated.orderNumber,
          customer_name: updated.customerName,
          destination: updated.destination,
          priority: updated.priority,
          status: updated.status,
          total_cost: updated.totalCost,
          deadline: updated.deadline,
          vehicle_id: updated.vehicleId,
          vehicle_code: updated.vehicleCode,
        }),
      });
    } catch (err) {
      throw err;
    }

    return updated;
  }

  async deleteOrder(id: string): Promise<void> {


    try {
      await this.fetchApi(`/api/v1/operations/orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      throw err;
    }
  }

  async getIncidents(severity?: string): Promise<IncidentItem[]> {
    const query = severity && severity !== "ALL" ? `?severity=${encodeURIComponent(severity)}` : "";
    const rows = await this.fetchApi<any[]>(`/api/v1/incidents${query}`);
    if (!Array.isArray(rows)) throw new Error("Incident service returned an invalid response.");
    return rows.map((i) => ({
      id: i.id, code: i.code, title: i.title, summary: i.summary, severity: i.severity,
      status: i.status, affectedEntityType: i.affected_entity_type,
      affectedEntityId: i.affected_entity_id, affectedEntityName: i.affected_entity_name,
      rootCause: i.root_cause ?? "", aiAnalysis: i.ai_analysis ?? "",
      potentialImpact: i.potential_impact ?? "", costEstimate: i.cost_estimate ?? null,
      ordersAffected: i.orders_affected ?? i.ordersAffected ?? null,
      delayMinutes: i.delay_minutes ?? null, createdAt: i.created_at ?? "",
      timeline: (i.timeline ?? []).map((t: any) => ({
        id: t.id, status: t.status, note: t.note, actorName: t.actor_name, createdAt: t.created_at,
      })),
    } as IncidentItem));
  }
  async getIncident(id: string): Promise<IncidentItem | null> {
    try {
      const i = await this.fetchApi<any>(`/api/v1/incidents/${id}`);
      if (!i) return null;
      return {
        id: i.id,
        code: i.code,
        title: i.title,
        summary: i.summary,
        severity: i.severity,
        status: i.status,
        affectedEntityType: i.affected_entity_type,
        affectedEntityId: i.affected_entity_id,
        affectedEntityName: i.affected_entity_name,
        rootCause: i.root_cause ?? "",
        aiAnalysis: i.ai_analysis ?? "",
        potentialImpact: "",
        costEstimate: i.cost_estimate ?? null as any,
        ordersAffected: i.orders_affected ?? i.ordersAffected ?? null as any,
        delayMinutes: i.delay_minutes ?? null as any,
        createdAt: i.created_at ?? "",
        timeline: (i.timeline || []).map((t: any) => ({
          id: t.id,
          status: t.status,
          note: t.note,
          actorName: t.actor_name,
          createdAt: t.created_at,
        })),
      };
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("NOT_FOUND")) {
        return null;
      }
      throw err;
    }
  }

  async createIncident(data: Partial<IncidentItem>): Promise<IncidentItem> {
    if (!data.title?.trim() || !data.summary?.trim() || !data.affectedEntityType || !data.affectedEntityId?.trim() || !data.affectedEntityName?.trim()) {
      throw new Error("Incident title, summary, affected asset type, ID, and name are required.");
    }
    const row = await this.fetchApi<any>("/api/v1/incidents", { method: "POST", body: JSON.stringify({
      title: data.title, summary: data.summary, severity: data.severity,
      affected_entity_type: data.affectedEntityType, affected_entity_id: data.affectedEntityId,
      affected_entity_name: data.affectedEntityName, delay_minutes: data.delayMinutes,
      cost_estimate: data.costEstimate, root_cause: data.rootCause, ai_analysis: data.aiAnalysis,
    }) });
    return { id: row.id, code: row.code, title: row.title, summary: row.summary, severity: row.severity,
      status: row.status, affectedEntityType: row.affected_entity_type, affectedEntityId: row.affected_entity_id,
      affectedEntityName: row.affected_entity_name, rootCause: row.root_cause ?? "", aiAnalysis: row.ai_analysis ?? "",
      potentialImpact: row.potential_impact ?? "", costEstimate: row.cost_estimate ?? null as any,
      ordersAffected: row.orders_affected ?? null as any, delayMinutes: row.delay_minutes ?? null as any,
      timeline: (row.timeline ?? []).map((t: any) => ({ id: t.id, status: t.status, note: t.note, actorName: t.actor_name, createdAt: t.created_at })),
      createdAt: row.created_at };
  }
  async transitionIncident(id: string, status: string, note: string, actorName?: string): Promise<IncidentItem> {
    const res = await this.fetchApi<any>(`/api/v1/incidents/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ status, note, ...(actorName ? { actor_name: actorName } : {}) }),
    });
    return {
      id: res.id,
      code: res.code,
      title: res.title,
      summary: res.summary,
      severity: res.severity as any,
      status: res.status as any,
      affectedEntityType: res.affected_entity_type as any,
      affectedEntityId: res.affected_entity_id,
      affectedEntityName: res.affected_entity_name,
      rootCause: res.root_cause,
      aiAnalysis: res.ai_analysis,
      potentialImpact: "",
      costEstimate: res.cost_estimate,
      ordersAffected: res.orders_affected ?? res.ordersAffected ?? 0,
      delayMinutes: res.delay_minutes,
      timeline: res.timeline || [],
      createdAt: res.created_at,
    };
  }

  private mapSimulation(s: any): SimulationItem {
    const baseline = s.baseline_metrics ?? s.baselineMetrics ?? {};
    const metrics = s.simulated_metrics ?? s.simulatedMetrics ?? {};
    return {
      id: s.id, code: s.code, title: s.title, description: s.description,
      incidentId: s.incident_id ?? s.incidentId, status: s.status,
      variables: s.variables ?? {},
      baselineMetrics: {
        totalDistanceKm: baseline.totalDistanceKm ?? baseline.total_distance_km,
        projectedDelayMins: baseline.currentDelayMins ?? baseline.current_delay_mins ?? baseline.projectedDelayMins,
        slaBreachRiskPct: baseline.slaBreachRiskPct ?? baseline.sla_breach_risk_pct,
        totalCostUsd: baseline.baseCostUsd ?? baseline.base_cost_usd,
      },
      simulatedMetrics: {
        totalDistanceKm: metrics.totalDistanceKm ?? metrics.total_distance_km,
        projectedDelayMins: metrics.projectedDelayMins ?? metrics.projected_delay_mins,
        slaBreachRiskPct: metrics.slaBreachRiskPct ?? metrics.sla_breach_risk_pct,
        totalCostUsd: metrics.totalCostUsd ?? metrics.total_cost_usd,
        netTimeSavedMins: metrics.netTimeSavedMins ?? metrics.net_time_saved_mins,
        costDeltaUsd: metrics.costDeltaUsd ?? metrics.cost_delta_usd,
        recommendationScore: metrics.recommendationScore ?? metrics.recommendation_score,
        verdict: metrics.verdict,
        insights: metrics.insights ?? [],
      },
      aiBriefing: s.ai_briefing ?? s.aiBriefing, appliedAt: s.applied_at ?? s.appliedAt,
      appliedBy: s.applied_by ?? s.appliedBy, createdAt: s.created_at ?? s.createdAt ?? "",
    };
  }

  async getSimulations(): Promise<SimulationItem[]> {
    const rows = await this.fetchApi<any[]>("/api/v1/simulations");
    if (!Array.isArray(rows)) throw new Error("Simulation service returned an invalid response.");
    return rows.map((row) => this.mapSimulation(row));
  }
  async getSimulation(id: string): Promise<SimulationItem | null> {
    try {
      const row = await this.fetchApi<any>(`/api/v1/simulations/${encodeURIComponent(id)}`);
      return row ? this.mapSimulation(row) : null;
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("NOT_FOUND")) return null;
      throw err;
    }
  }
  async createSimulation(data: any): Promise<SimulationItem> {
    const row = await this.fetchApi<any>("/api/v1/simulations", { method: "POST", body: JSON.stringify(data) });
    return this.mapSimulation(row);
  }
  async applyDecision(simId: string, actorName?: string): Promise<SimulationItem> {
    const row = await this.fetchApi<any>(`/api/v1/simulations/${encodeURIComponent(simId)}/apply-decision`, {
      method: "POST", body: JSON.stringify(actorName ? { actor_name: actorName } : {}),
    });
    return this.mapSimulation(row);
  }
  async getNotifications(): Promise<NotificationItem[]> {
    const data = await this.fetchApi<any[]>("/api/v1/notifications");
    if (Array.isArray(data)) {
      return data.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        deepLink: n.deep_link,
        read: n.read,
        createdAt: n.created_at,
      }));
    }
    throw new Error("Notification service returned an invalid response.");
  }

  async markNotificationRead(id: string): Promise<NotificationItem> {
    const n = await this.fetchApi<any>(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      deepLink: n.deep_link,
      read: n.read,
      createdAt: n.created_at,
    };
  }

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const data = await this.fetchApi<any[]>("/api/v1/admin/audit");
    if (Array.isArray(data)) {
      return data.map((a) => ({
        id: a.id,
        actorName: a.actor_name,
        action: a.action,
        entityType: a.entity_type,
        entityId: a.entity_id,
        details: a.details,
        createdAt: a.created_at,
      }));
    }
    throw new Error("Audit service returned an invalid response.");
  }

  async getPipelineHealth(): Promise<PipelineHealthItem[]> {
    const data = await this.fetchApi<any[]>("/api/v1/admin/pipeline");
    if (Array.isArray(data)) {
      return data.map((p) => ({
        id: p.id,
        sourceName: p.source_name,
        sourceType: p.source_type,
        status: p.status,
        latencyMs: p.latency_ms,
        throughputPerSec: p.throughput_per_sec,
        recordsToday: p.records_today,
        errorCount: p.error_count || 0,
        lastSyncAt: p.last_sync_at ?? null,
      }));
    }
    throw new Error("Pipeline service returned an invalid response.");
  }

  async getUsers(): Promise<UserItem[]> {
    const data = await this.fetchApi<any[]>("/api/v1/admin/users");
    if (Array.isArray(data)) {
      return data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || "Not set",
        active: u.is_active ?? u.isActive ?? false,
        lastActive: u.last_login_at ?? u.updated_at ?? null,
      }));
    }
    throw new Error("User service returned an invalid response.");
  }

  async getUser(id: string): Promise<UserItem | null> {
    try {
      const u = await this.fetchApi<any>(`/api/v1/admin/users/${id}`);
      if (!u) return null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department || "Not set",
        active: u.is_active ?? u.isActive ?? false,
        lastActive: u.last_login_at ?? u.updated_at ?? null,
      };
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("NOT_FOUND")) {
        return null;
      }
      throw err;
    }
  }

  async updateUserRole(id: string, role: string): Promise<UserItem> {
    const u = await this.fetchApi<any>(`/api/v1/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || "Not set",
      active: u.is_active ?? u.isActive ?? false,
      lastActive: u.last_login_at ?? u.updated_at ?? null,
    };
  }

  async getEvents(): Promise<OperationalEventItem[]> {
    const data = await this.fetchApi<any[]>("/api/v1/intelligence/events");
    if (!Array.isArray(data)) throw new Error("Event service returned an invalid response.");
    return data.map((e) => ({
      id: e.id, eventType: e.eventType ?? e.event_type, entityType: e.entityType ?? e.entity_type,
      entityId: e.entityId ?? e.entity_id, severity: e.severity, message: e.message,
      occurredAt: e.occurredAt ?? e.occurred_at ?? null,
    }));
  }

  async submitContact(data: any): Promise<void> {
    await this.fetchApi("/api/v1/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(data: any): Promise<void> {
    await this.fetchApi("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<any> {
    return this.fetchApi("/api/v1/me/profile");
  }

  async updateProfile(data: any): Promise<any> {
    return this.fetchApi("/api/v1/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getSettings(): Promise<any> {
    return this.fetchApi("/api/v1/me/settings");
  }

  async updateSettings(data: any): Promise<any> {
    return this.fetchApi("/api/v1/me/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

/**
 * Authoritative singleton instance.
 * Defaults strictly to ApiNexusDataProvider.
 */
export const dataProvider: NexusDataProvider = new ApiNexusDataProvider();
