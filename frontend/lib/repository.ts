import {
  INITIAL_WAREHOUSES,
  INITIAL_VEHICLES,
  INITIAL_ROUTES,
  INITIAL_ORDERS,
  INITIAL_INCIDENTS,
  INITIAL_SIMULATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_EVENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_PIPELINE,
  WarehouseItem,
  VehicleItem,
  RouteItem,
  OrderItem,
  IncidentItem,
  SimulationItem,
  NotificationItem,
  OperationalEventItem,
  AuditLogItem,
  UserItem,
  PipelineHealthItem,
} from "./mock-data";
import { runDeterministicSimulation, SimulationVariables } from "./simulation-engine";

// State store in memory (persisted in node memory for the dev server lifecycle)
class NexusDataStore {
  warehouses: WarehouseItem[] = [...INITIAL_WAREHOUSES];
  vehicles: VehicleItem[] = [...INITIAL_VEHICLES];
  routes: RouteItem[] = [...INITIAL_ROUTES];
  orders: OrderItem[] = [...INITIAL_ORDERS];
  incidents: IncidentItem[] = [...INITIAL_INCIDENTS];
  simulations: SimulationItem[] = [...INITIAL_SIMULATIONS];
  notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  events: OperationalEventItem[] = [...INITIAL_EVENTS];
  auditLogs: AuditLogItem[] = [...INITIAL_AUDIT_LOGS];
  users: UserItem[] = [...INITIAL_USERS];
  pipeline: PipelineHealthItem[] = [...INITIAL_PIPELINE];

  getOverviewStats() {
    const totalVehicles = this.vehicles.length;
    const activeVehicles = this.vehicles.filter((v) => v.status === "IN_TRANSIT").length;
    const totalWarehouses = this.warehouses.length;
    const activeIncidents = this.incidents.filter((i) => i.status !== "RESOLVED" && i.status !== "ARCHIVED").length;
    const delayedOrders = this.orders.filter((o) => o.status === "DELAYED").length;
    const totalOrders = this.orders.length;
    const slaCompliance = Math.round(((totalOrders - delayedOrders) / Math.max(1, totalOrders)) * 100);
    const fleetUtilization = Math.round((activeVehicles / Math.max(1, totalVehicles)) * 100);

    return {
      totalVehicles,
      activeVehicles,
      totalWarehouses,
      activeIncidents,
      totalOrders,
      delayedOrders,
      slaCompliance,
      fleetUtilization,
      networkEfficiency: 95.2,
      activeSimulations: this.simulations.length,
      unreadNotifications: this.notifications.filter((n) => !n.read).length,
    };
  }

  getWarehouses() {
    return this.warehouses;
  }

  getWarehouseById(id: string) {
    return this.warehouses.find((w) => w.id === id || w.code === id);
  }

  getVehicles() {
    return this.vehicles;
  }

  getVehicleById(id: string) {
    return this.vehicles.find((v) => v.id === id || v.code === id);
  }

  updateVehicle(id: string, data: Partial<VehicleItem>) {
    const idx = this.vehicles.findIndex((v) => v.id === id || v.code === id);
    if (idx !== -1) {
      this.vehicles[idx] = { ...this.vehicles[idx], ...data };
      return this.vehicles[idx];
    }
    return null;
  }

  getRoutes() {
    return this.routes;
  }

  getRouteById(id: string) {
    return this.routes.find((r) => r.id === id || r.code === id);
  }

  getOrders() {
    return this.orders;
  }

  getOrderById(id: string) {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  getIncidents() {
    return this.incidents;
  }

  getIncidentById(id: string) {
    return this.incidents.find((i) => i.id === id || i.code === id);
  }

  updateIncidentStatus(id: string, status: IncidentItem["status"], note: string, actorName = "Sarah Chen") {
    const inc = this.incidents.find((i) => i.id === id || i.code === id);
    if (!inc) return null;

    inc.status = status;
    inc.timeline.unshift({
      id: `tl-${Date.now()}`,
      status,
      note,
      actorName,
      createdAt: new Date().toISOString(),
    });

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actorName,
      action: `INCIDENT_STATUS_${status}`,
      entityType: "INCIDENT",
      entityId: inc.id,
      details: `Incident ${inc.code} status changed to ${status}: ${note}`,
      createdAt: new Date().toISOString(),
    });

    this.events.unshift({
      id: `ev-${Date.now()}`,
      eventType: "incident.status_changed",
      entityType: "INCIDENT",
      entityId: inc.id,
      severity: status === "RESOLVED" ? "SUCCESS" : "WARNING",
      message: `Incident ${inc.code} transitioned to ${status}`,
      occurredAt: new Date().toISOString(),
    });

    return inc;
  }

  createIncident(data: Partial<IncidentItem>) {
    const id = `inc-${Date.now()}`;
    const code = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc: IncidentItem = {
      id,
      code,
      title: data.title || "Unclassified Telemetry Anomaly",
      summary: data.summary || "Automated anomaly detection alert.",
      severity: data.severity || "HIGH",
      status: "DETECTED",
      affectedEntityType: data.affectedEntityType || "VEHICLE",
      affectedEntityId: data.affectedEntityId || "v-104",
      affectedEntityName: data.affectedEntityName || "NX-TRK-104",
      rootCause: data.rootCause || "Sensor telemetry divergence.",
      aiAnalysis: data.aiAnalysis || "Recommend inspection.",
      potentialImpact: data.potentialImpact || "Minor operational delay.",
      costEstimate: data.costEstimate || 1500,
      ordersAffected: data.ordersAffected || 2,
      delayMinutes: data.delayMinutes || 45,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}`,
          status: "DETECTED",
          note: "Anomaly flagged by automated sensor telemetry.",
          actorName: "Nexus Telemetry Grid",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.incidents.unshift(newInc);

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: newInc.severity === "CRITICAL" ? "CRITICAL" : "ATTENTION",
      title: `New Incident: ${newInc.title}`,
      message: newInc.summary,
      entityType: "INCIDENT",
      entityId: newInc.id,
      deepLink: `/incidents/${newInc.id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return newInc;
  }

  getSimulations() {
    return this.simulations;
  }

  getSimulationById(id: string) {
    return this.simulations.find((s) => s.id === id || s.code === id);
  }

  createSimulation(title: string, description: string, variables: SimulationVariables, incidentId?: string) {
    const baseSnapshot = {
      totalDistanceKm: 1620.0,
      avgDurationMins: 940,
      currentDelayMins: 180,
      ordersCount: 14,
      totalOrderValue: 45000,
      baseCostUsd: 1450.0,
    };

    const simulated = runDeterministicSimulation(baseSnapshot, variables);
    const id = `sim-${Date.now()}`;
    const code = `SIM-SCENARIO-${Math.floor(100 + Math.random() * 900)}`;

    const newSim: SimulationItem = {
      id,
      code,
      title,
      description,
      status: "COMPLETED",
      incidentId,
      variables,
      baselineMetrics: {
        totalDistanceKm: baseSnapshot.totalDistanceKm,
        projectedDelayMins: baseSnapshot.currentDelayMins,
        slaBreachRiskPct: 88.0,
        totalCostUsd: baseSnapshot.baseCostUsd,
      },
      simulatedMetrics: simulated,
      aiBriefing: `Simulation ${code} executed: projected time recovery of ${simulated.netTimeSavedMins} mins with cost delta of $${simulated.costDeltaUsd}. Recommendation: ${simulated.verdict}.`,
      createdAt: new Date().toISOString(),
    };

    this.simulations.unshift(newSim);

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actorName: "Marcus Vance",
      action: "SIMULATION_CREATED",
      entityType: "SIMULATION",
      entityId: id,
      details: `Scenario ${code} executed: ${simulated.netTimeSavedMins} mins saved.`,
      createdAt: new Date().toISOString(),
    });

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      type: "SIMULATION",
      title: `Simulation Ready: ${title}`,
      message: `Projected ${simulated.netTimeSavedMins} min time recovery (${simulated.verdict}).`,
      entityType: "SIMULATION",
      entityId: id,
      deepLink: `/simulations/${id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return newSim;
  }

  applyDecision(simId: string, actorName = "Sarah Chen") {
    const sim = this.simulations.find((s) => s.id === simId || s.code === simId);
    if (!sim) return null;

    sim.status = "APPLIED";
    sim.appliedAt = new Date().toISOString();
    sim.appliedBy = actorName;

    // If associated with incident, resolve or advance incident
    if (sim.incidentId) {
      this.updateIncidentStatus(
        sim.incidentId,
        "ACTION_APPLIED",
        `Decision applied from scenario ${sim.code}: Reroute active, projected ${sim.simulatedMetrics.netTimeSavedMins} min delay mitigation.`,
        actorName
      );
    }

    // Update vehicle status
    if (sim.variables.vehicleId) {
      this.updateVehicle(sim.variables.vehicleId, {
        speedKmh: 78.0,
        status: "IN_TRANSIT",
      });
    }

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actorName,
      action: "DECISION_APPLIED",
      entityType: "SIMULATION",
      entityId: sim.id,
      details: `Operational state updated based on simulation ${sim.code}.`,
      createdAt: new Date().toISOString(),
    });

    this.events.unshift({
      id: `ev-${Date.now()}`,
      eventType: "decision.applied",
      entityType: "SIMULATION",
      entityId: sim.id,
      severity: "SUCCESS",
      message: `Scenario ${sim.code} applied to live fleet dispatch.`,
      occurredAt: new Date().toISOString(),
    });

    return sim;
  }

  getNotifications() {
    return this.notifications;
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find((item) => item.id === id);
    if (n) n.read = true;
    return n;
  }

  markAllNotificationsRead() {
    this.notifications.forEach((n) => (n.read = true));
    return this.notifications;
  }

  getEvents() {
    return this.events;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getUsers() {
    return this.users;
  }

  updateUser(id: string, data: Partial<UserItem>) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...data };
      return this.users[idx];
    }
    return null;
  }

  createUser(data: Partial<UserItem>) {
    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      name: data.name || "New Operator",
      email: data.email || "operator@nexus.ops",
      role: data.role || "OPERATOR",
      department: data.department || "Operations",
      active: true,
      lastActive: "Just now",
    };
    this.users.unshift(newUser);
    return newUser;
  }

  getPipeline() {
    return this.pipeline;
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as {
  nexusStore: NexusDataStore | undefined;
};

export const repository = globalForStore.nexusStore ?? new NexusDataStore();
if (process.env.NODE_ENV !== "production") globalForStore.nexusStore = repository;
