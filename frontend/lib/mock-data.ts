export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  capacityUnits: number;
  currentUnits: number;
  dockCount: number;
  activeDocks: number;
  efficiencyPct: number;
  status: "OPERATIONAL" | "ATTENTION" | "CRITICAL";
  createdAt: string;
}

export interface VehicleItem {
  id: string;
  code: string;
  name: string;
  model: string;
  driverName: string;
  driverPhone: string;
  capacityKg: number;
  currentLoadKg: number;
  batteryPct: number;
  healthScore: number;
  speedKmh: number;
  lat: number;
  lng: number;
  heading: number;
  status: "IN_TRANSIT" | "IDLE" | "LOADING" | "MAINTENANCE" | "OUT_OF_SERVICE";
  currentRouteId: string | null;
  currentRouteCode?: string;
  currentRouteName?: string;
}

export interface RouteItem {
  id: string;
  code: string;
  name: string;
  originWarehouseId: string;
  originWarehouseName: string;
  destWarehouseId: string;
  destWarehouseName: string;
  distanceKm: number;
  avgDurationMins: number;
  riskScore: number;
  trafficCondition: "CLEAR" | "MODERATE_TRAFFIC" | "HEAVY_CONGESTION" | "SEVERE_WEATHER_ALERT";
  waypoints: Array<{ lat: number; lng: number; label: string }>;
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "DELAYED" | "CANCELLED";
  warehouseId: string | null;
  warehouseName?: string;
  routeId: string | null;
  routeName?: string;
  vehicleId: string | null;
  vehicleCode?: string;
  deadline: string;
  estimatedEta: string;
  itemsCount: number;
  totalCost: number;
  slaCompliant: boolean;
}

export interface IncidentItem {
  id: string;
  code: string;
  title: string;
  summary: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "DETECTED" | "ACKNOWLEDGED" | "INVESTIGATING" | "SIMULATING" | "ACTION_PENDING" | "ACTION_APPLIED" | "RESOLVED" | "ARCHIVED";
  affectedEntityType: "VEHICLE" | "ROUTE" | "WAREHOUSE" | "ORDER";
  affectedEntityId: string;
  affectedEntityName: string;
  rootCause: string;
  aiAnalysis: string;
  potentialImpact: string;
  costEstimate: number;
  ordersAffected: number;
  delayMinutes: number;
  createdAt: string;
  timeline: Array<{
    id: string;
    status: string;
    note: string;
    actorName: string;
    createdAt: string;
  }>;
}

export interface SimulationItem {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "APPLIED" | "FAILED";
  incidentId?: string;
  variables: {
    vehicleId?: string;
    currentRouteId?: string;
    alternateRouteType?: string;
    speedDeltaPct?: number;
    fuelCostPerKm?: number;
    priorityReordering?: boolean;
    auxiliaryRelayVehicle?: string;
  };
  baselineMetrics: {
    totalDistanceKm?: number;
    projectedDelayMins?: number;
    slaBreachRiskPct?: number;
    totalCostUsd?: number;
  };
  simulatedMetrics: {
    totalDistanceKm?: number;
    projectedDelayMins?: number;
    slaBreachRiskPct?: number;
    totalCostUsd?: number;
    netTimeSavedMins?: number;
    costDeltaUsd?: number;
    recommendationScore?: number;
    verdict?: string;
    insights?: string[];
  };
  aiBriefing?: string;
  appliedAt?: string;
  appliedBy?: string;
  createdAt: string;
}

export interface OperationalEventItem {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS" | "SIMULATION";
  message: string;
  occurredAt: string;
}

export interface NotificationItem {
  id: string;
  type: "CRITICAL" | "ATTENTION" | "INFO" | "SUCCESS" | "SIMULATION";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMINISTRATOR" | "OPERATIONS_MANAGER" | "ANALYST" | "OPERATOR" | "VIEWER";
  department: string;
  active: boolean;
  lastActive: string | null;
}

export interface PipelineHealthItem {
  id: string;
  sourceName: string;
  sourceType: string;
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  throughputPerSec: number;
  recordsToday: number;
  errorCount: number;
  lastSyncAt: string | null;
}
