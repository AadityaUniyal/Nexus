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
    totalDistanceKm: number;
    projectedDelayMins: number;
    slaBreachRiskPct: number;
    totalCostUsd: number;
  };
  simulatedMetrics: {
    totalDistanceKm: number;
    projectedDelayMins: number;
    slaBreachRiskPct: number;
    totalCostUsd: number;
    netTimeSavedMins: number;
    costDeltaUsd: number;
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
  lastActive: string;
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
  lastSyncAt: string;
}

// Initial In-Memory State & Deterministic Repository
export const INITIAL_WAREHOUSES: WarehouseItem[] = [
  {
    id: "wh-chi",
    code: "WH-CHI",
    name: "Chicago Central Logistics Hub",
    city: "Chicago",
    state: "IL",
    lat: 41.8781,
    lng: -87.6298,
    capacityUnits: 15000,
    currentUnits: 12450,
    dockCount: 24,
    activeDocks: 19,
    efficiencyPct: 96.4,
    status: "OPERATIONAL",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "wh-dfw",
    code: "WH-DFW",
    name: "Dallas-Fort Worth Freight Center",
    city: "Dallas",
    state: "TX",
    lat: 32.7767,
    lng: -96.7970,
    capacityUnits: 18000,
    currentUnits: 14200,
    dockCount: 28,
    activeDocks: 22,
    efficiencyPct: 94.8,
    status: "OPERATIONAL",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "wh-atl",
    code: "WH-ATL",
    name: "Atlanta Gateway Superhub",
    city: "Atlanta",
    state: "GA",
    lat: 33.7490,
    lng: -84.3880,
    capacityUnits: 14000,
    currentUnits: 11100,
    dockCount: 20,
    activeDocks: 16,
    efficiencyPct: 91.2,
    status: "ATTENTION",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "wh-den",
    code: "WH-DEN",
    name: "Denver Mountain Terminal",
    city: "Denver",
    state: "CO",
    lat: 39.7392,
    lng: -104.9903,
    capacityUnits: 10000,
    currentUnits: 7200,
    dockCount: 16,
    activeDocks: 12,
    efficiencyPct: 97.1,
    status: "OPERATIONAL",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "wh-sea",
    code: "WH-SEA",
    name: "Seattle Puget Sound Depot",
    city: "Seattle",
    state: "WA",
    lat: 47.6062,
    lng: -122.3321,
    capacityUnits: 12000,
    currentUnits: 8900,
    dockCount: 18,
    activeDocks: 14,
    efficiencyPct: 95.5,
    status: "OPERATIONAL",
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "wh-nyc",
    code: "WH-NYC",
    name: "New York Metro Fulfilment Hub",
    city: "Newark",
    state: "NJ",
    lat: 40.7357,
    lng: -74.1724,
    capacityUnits: 20000,
    currentUnits: 17800,
    dockCount: 32,
    activeDocks: 28,
    efficiencyPct: 93.6,
    status: "OPERATIONAL",
    createdAt: "2026-08-20T10:00:00Z",
  },
];

export const INITIAL_ROUTES: RouteItem[] = [
  {
    id: "rt-chi-den",
    code: "RT-CHI-DEN-01",
    name: "I-80 West Continental Corridor",
    originWarehouseId: "wh-chi",
    originWarehouseName: "Chicago Central Hub",
    destWarehouseId: "wh-den",
    destWarehouseName: "Denver Mountain Terminal",
    distanceKm: 1620.0,
    avgDurationMins: 940,
    riskScore: 78.5,
    trafficCondition: "SEVERE_WEATHER_ALERT",
    waypoints: [
      { lat: 41.8781, lng: -87.6298, label: "Chicago Origin" },
      { lat: 41.5868, lng: -93.6250, label: "Des Moines Hub" },
      { lat: 41.2565, lng: -95.9345, label: "Omaha Relay" },
      { lat: 41.1400, lng: -104.8202, label: "Cheyenne Summit (Blizzard Delay)" },
      { lat: 39.7392, lng: -104.9903, label: "Denver Terminal" },
    ],
  },
  {
    id: "rt-chi-nyc",
    code: "RT-CHI-NYC-01",
    name: "I-80 / I-76 East Express",
    originWarehouseId: "wh-chi",
    originWarehouseName: "Chicago Central Hub",
    destWarehouseId: "wh-nyc",
    destWarehouseName: "New York Metro Hub",
    distanceKm: 1270.0,
    avgDurationMins: 760,
    riskScore: 14.2,
    trafficCondition: "CLEAR",
    waypoints: [
      { lat: 41.8781, lng: -87.6298, label: "Chicago Origin" },
      { lat: 41.4993, lng: -81.6944, label: "Cleveland Waypoint" },
      { lat: 40.4406, lng: -79.9959, label: "Pittsburgh Relay" },
      { lat: 40.7357, lng: -74.1724, label: "Newark Terminal" },
    ],
  },
  {
    id: "rt-dfw-atl",
    code: "RT-DFW-ATL-01",
    name: "I-20 Southern Transverse",
    originWarehouseId: "wh-dfw",
    originWarehouseName: "Dallas-Fort Worth Freight Center",
    destWarehouseId: "wh-atl",
    destWarehouseName: "Atlanta Gateway Superhub",
    distanceKm: 1250.0,
    avgDurationMins: 720,
    riskScore: 18.0,
    trafficCondition: "MODERATE_TRAFFIC",
    waypoints: [
      { lat: 32.7767, lng: -96.7970, label: "Dallas Origin" },
      { lat: 32.5252, lng: -93.7502, label: "Shreveport Waypoint" },
      { lat: 32.2988, lng: -90.1848, label: "Jackson Relay" },
      { lat: 33.7490, lng: -84.3880, label: "Atlanta Terminal" },
    ],
  },
  {
    id: "rt-sea-den",
    code: "RT-SEA-DEN-01",
    name: "I-84 / I-80 Northwest Line",
    originWarehouseId: "wh-sea",
    originWarehouseName: "Seattle Puget Sound Depot",
    destWarehouseId: "wh-den",
    destWarehouseName: "Denver Mountain Terminal",
    distanceKm: 2100.0,
    avgDurationMins: 1240,
    riskScore: 22.4,
    trafficCondition: "CLEAR",
    waypoints: [
      { lat: 47.6062, lng: -122.3321, label: "Seattle Origin" },
      { lat: 43.6150, lng: -116.2023, label: "Boise Waypoint" },
      { lat: 41.2565, lng: -111.0000, label: "Utah-Wyoming Gateway" },
      { lat: 39.7392, lng: -104.9903, label: "Denver Terminal" },
    ],
  },
];

export const INITIAL_VEHICLES: VehicleItem[] = [
  {
    id: "v-104",
    code: "NX-TRK-104",
    name: "Nexus Alpha Hauler 104",
    model: "Freightliner eCascadia Long-Range",
    driverName: "Robert Langdon",
    driverPhone: "+1 (312) 555-0184",
    capacityKg: 20000,
    currentLoadKg: 16800,
    batteryPct: 64.5,
    healthScore: 92.0,
    speedKmh: 42.0,
    lat: 41.1400,
    lng: -104.8202,
    heading: 245.0,
    status: "IN_TRANSIT",
    currentRouteId: "rt-chi-den",
    currentRouteCode: "RT-CHI-DEN-01",
    currentRouteName: "I-80 West Continental Corridor",
  },
  {
    id: "v-109",
    code: "NX-TRK-109",
    name: "Nexus Cryo-Express 109",
    model: "Volvo VNR Electric Refrig-Unit",
    driverName: "Maya Lin",
    driverPhone: "+1 (214) 555-0199",
    capacityKg: 15000,
    currentLoadKg: 11200,
    batteryPct: 88.0,
    healthScore: 78.4,
    speedKmh: 74.0,
    lat: 32.4500,
    lng: -92.2000,
    heading: 85.0,
    status: "IN_TRANSIT",
    currentRouteId: "rt-dfw-atl",
    currentRouteCode: "RT-DFW-ATL-01",
    currentRouteName: "I-20 Southern Transverse",
  },
  {
    id: "v-112",
    code: "NX-TRK-112",
    name: "Nexus High-Cube Carrier 112",
    model: "Tesla Semi Commercial Class-8",
    driverName: "Arthur Pendelton",
    driverPhone: "+1 (404) 555-0112",
    capacityKg: 22000,
    currentLoadKg: 19400,
    batteryPct: 91.5,
    healthScore: 99.1,
    speedKmh: 88.0,
    lat: 41.3000,
    lng: -80.5000,
    heading: 105.0,
    status: "IN_TRANSIT",
    currentRouteId: "rt-chi-nyc",
    currentRouteCode: "RT-CHI-NYC-01",
    currentRouteName: "I-80 / I-76 East Express",
  },
  {
    id: "v-115",
    code: "NX-TRK-115",
    name: "Nexus Cascade Transporter 115",
    model: "Freightliner eCascadia Eco",
    driverName: "Chloe Bennett",
    driverPhone: "+1 (206) 555-0115",
    capacityKg: 18000,
    currentLoadKg: 9400,
    batteryPct: 76.0,
    healthScore: 96.8,
    speedKmh: 82.0,
    lat: 44.5000,
    lng: -115.8000,
    heading: 135.0,
    status: "IN_TRANSIT",
    currentRouteId: "rt-sea-den",
    currentRouteCode: "RT-SEA-DEN-01",
    currentRouteName: "I-84 / I-80 Northwest Line",
  },
  {
    id: "v-120",
    code: "NX-TRK-120",
    name: "Nexus Metro Feeder 120",
    model: "Mercedes-Benz eActros 400",
    driverName: "Carlos Gomez",
    driverPhone: "+1 (973) 555-0120",
    capacityKg: 12000,
    currentLoadKg: 0,
    batteryPct: 100.0,
    healthScore: 100.0,
    speedKmh: 0.0,
    lat: 40.7357,
    lng: -74.1724,
    heading: 0.0,
    status: "IDLE",
    currentRouteId: null,
  },
];

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ord-9041",
    orderNumber: "ORD-2026-9041",
    customerName: "AeroTech Avionics Corp",
    destination: "Denver Tech Center, CO",
    priority: "CRITICAL",
    status: "DELAYED",
    warehouseId: "wh-chi",
    warehouseName: "Chicago Central Logistics Hub",
    routeId: "rt-chi-den",
    routeName: "I-80 West Continental Corridor",
    vehicleId: "v-104",
    vehicleCode: "NX-TRK-104",
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    estimatedEta: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
    itemsCount: 84,
    totalCost: 14500.0,
    slaCompliant: false,
  },
  {
    id: "ord-9042",
    orderNumber: "ORD-2026-9042",
    customerName: "Vanguard Biopharma Laboratories",
    destination: "Emory University Medical Center, GA",
    priority: "CRITICAL",
    status: "IN_TRANSIT",
    warehouseId: "wh-dfw",
    warehouseName: "Dallas-Fort Worth Freight Center",
    routeId: "rt-dfw-atl",
    routeName: "I-20 Southern Transverse",
    vehicleId: "v-109",
    vehicleCode: "NX-TRK-109",
    deadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    estimatedEta: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    itemsCount: 120,
    totalCost: 28900.0,
    slaCompliant: true,
  },
  {
    id: "ord-9043",
    orderNumber: "ORD-2026-9043",
    customerName: "NorthEast MicroElectronics Inc",
    destination: "Silicon Alley Logistics Depot, NY",
    priority: "HIGH",
    status: "IN_TRANSIT",
    warehouseId: "wh-chi",
    warehouseName: "Chicago Central Logistics Hub",
    routeId: "rt-chi-nyc",
    routeName: "I-80 / I-76 East Express",
    vehicleId: "v-112",
    vehicleCode: "NX-TRK-112",
    deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    estimatedEta: new Date(Date.now() + 9 * 3600 * 1000).toISOString(),
    itemsCount: 210,
    totalCost: 18400.0,
    slaCompliant: true,
  },
  {
    id: "ord-9044",
    orderNumber: "ORD-2026-9044",
    customerName: "Rocky Mountain Renewable Grid",
    destination: "Fort Collins Industrial Park, CO",
    priority: "NORMAL",
    status: "IN_TRANSIT",
    warehouseId: "wh-sea",
    warehouseName: "Seattle Puget Sound Depot",
    routeId: "rt-sea-den",
    routeName: "I-84 / I-80 Northwest Line",
    vehicleId: "v-115",
    vehicleCode: "NX-TRK-115",
    deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    estimatedEta: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    itemsCount: 65,
    totalCost: 9200.0,
    slaCompliant: true,
  },
  {
    id: "ord-9045",
    orderNumber: "ORD-2026-9045",
    customerName: "Midwest Precision Machining",
    destination: "Manhattan Distribution Hub, NY",
    priority: "NORMAL",
    status: "ASSIGNED",
    warehouseId: "wh-nyc",
    warehouseName: "New York Metro Fulfilment Hub",
    routeId: null,
    vehicleId: "v-120",
    vehicleCode: "NX-TRK-120",
    deadline: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    estimatedEta: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    itemsCount: 40,
    totalCost: 5100.0,
    slaCompliant: true,
  },
];

export const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: "inc-8041",
    code: "INC-8041",
    title: "I-80 Wyoming Pass Severe Snowstorm & Road Closure",
    summary:
      "Extreme blizzards and jackknifed trailers on Interstate 80 near Cheyenne Pass have blocked westbound traffic. Transit times increased by ~180 minutes.",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    affectedEntityType: "ROUTE",
    affectedEntityId: "rt-chi-den",
    affectedEntityName: "RT-CHI-DEN-01 (I-80 West)",
    rootCause:
      "Sudden blizzard event with 45mph winds causing complete highway closure between mile markers 310 and 345.",
    aiAnalysis:
      "Recommend immediate reroute of Vehicle NX-TRK-104 via Southern US-40 or I-70 detour to save 135 mins and protect SLA on AeroTech high-value payload.",
    potentialImpact: "Delay of 180 mins across 14 orders with estimated penalty risk of $4,200.",
    costEstimate: 4200.0,
    ordersAffected: 14,
    delayMinutes: 180,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    timeline: [
      {
        id: "tl-1",
        status: "DETECTED",
        note: "Automated Weather Telemetry Trigger: Blizzard warning level 4 detected on I-80 corridor.",
        actorName: "Nexus Environmental Sensor Grid",
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: "tl-2",
        status: "ACKNOWLEDGED",
        note: "Incident acknowledged by Dispatch Operator Elena Rostova. Flagged for Simulation.",
        actorName: "Elena Rostova",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "tl-3",
        status: "INVESTIGATING",
        note: "Contacted DOT Wyoming Patrol: Highway estimated closed for at least 3.5 hours. Initiating reroute simulation.",
        actorName: "Sarah Chen",
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "inc-8042",
    code: "INC-8042",
    title: "Cryo-Compressor Secondary Sensor Alert on Vehicle NX-TRK-109",
    summary:
      "Secondary temperature probe on refrigerated cargo bay reported +3.2°C drift above target threshold of -20°C for biopharma cargo.",
    severity: "HIGH",
    status: "DETECTED",
    affectedEntityType: "VEHICLE",
    affectedEntityId: "v-109",
    affectedEntityName: "NX-TRK-109 (Cryo-Express)",
    rootCause:
      "Auxiliary power inverter voltage fluctuation causing secondary condenser cycle drop.",
    aiAnalysis:
      "Thermal buffer allows 45 mins before critical threshold breach. Direct driver to nearest certified service depot in Jackson, MS or activate backup nitrogen burst.",
    potentialImpact: "Risk of cargo spoilage valued at $28,900 if unaddressed within 60 mins.",
    costEstimate: 28900.0,
    ordersAffected: 1,
    delayMinutes: 35,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeline: [
      {
        id: "tl-4",
        status: "DETECTED",
        note: "IoT Telemetry Breach: Temperature sensor T-02 reported -16.8°C (threshold: -20°C +/- 2°C).",
        actorName: "ColdChain IoT Telemetry Agent",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ],
  },
];

export const INITIAL_SIMULATIONS: SimulationItem[] = [
  {
    id: "sim-901",
    code: "SIM-SCENARIO-901",
    title: "I-70 South Reroute vs Wait-and-Hold for NX-TRK-104",
    description:
      "Hypothetical simulation comparing active I-70 detour (+85 km) vs staying on I-80 holding pattern.",
    status: "COMPLETED",
    incidentId: "inc-8041",
    variables: {
      vehicleId: "v-104",
      currentRouteId: "rt-chi-den",
      alternateRouteType: "I-70_SOUTH_DETOUR",
      speedDeltaPct: 10,
      fuelCostPerKm: 0.42,
    },
    baselineMetrics: {
      totalDistanceKm: 1620.0,
      projectedDelayMins: 180,
      slaBreachRiskPct: 88.0,
      totalCostUsd: 1450.0,
    },
    simulatedMetrics: {
      totalDistanceKm: 1705.0,
      projectedDelayMins: 45,
      slaBreachRiskPct: 12.0,
      totalCostUsd: 1530.0,
      netTimeSavedMins: 135,
      costDeltaUsd: 80.0,
      recommendationScore: 94,
      verdict: "HIGHLY_RECOMMENDED",
      insights: [
        "I-70 Southern corridor bypasses high-altitude blizzard zones near Cheyenne Pass.",
        "Low risk of auxiliary refrigeration disruption with steady highway speeds.",
      ],
    },
    aiBriefing:
      "Rerouting NX-TRK-104 via the I-70 South corridor saves 135 minutes with minimal $80 operational fuel surcharge. Highly recommended to preserve AeroTech SLA compliance.",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "CRITICAL",
    title: "Severe Blizzard Alert on I-80 Pass",
    message: "Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.",
    entityType: "INCIDENT",
    entityId: "inc-8041",
    deepLink: "/incidents/inc-8041",
    read: false,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    type: "ATTENTION",
    title: "Thermal Unit Drift on NX-TRK-109",
    message: "Auxiliary condenser temperature deviation (+3.2°C) detected.",
    entityType: "INCIDENT",
    entityId: "inc-8042",
    deepLink: "/incidents/inc-8042",
    read: false,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    type: "SIMULATION",
    title: "Simulation Ready: I-70 Detour Analysis",
    message: "Scenario SIM-SCENARIO-901 shows 135 mins net time recovery.",
    entityType: "SIMULATION",
    entityId: "sim-901",
    deepLink: "/simulations/sim-901",
    read: true,
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_EVENTS: OperationalEventItem[] = [
  {
    id: "ev-1",
    eventType: "vehicle.telemetry",
    entityType: "VEHICLE",
    entityId: "v-104",
    severity: "WARNING",
    message: "Vehicle NX-TRK-104 speed decreased to 42 km/h due to road hazard alert.",
    occurredAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "ev-2",
    eventType: "incident.created",
    entityType: "INCIDENT",
    entityId: "inc-8041",
    severity: "CRITICAL",
    message: "Critical Incident INC-8041 generated for route RT-CHI-DEN-01.",
    occurredAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "ev-3",
    eventType: "simulation.completed",
    entityType: "SIMULATION",
    entityId: "sim-901",
    severity: "SIMULATION",
    message: "Simulation SIM-SCENARIO-901 completed with 135 mins net savings.",
    occurredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-1",
    actorName: "Devon Sterling",
    action: "WORKSPACE_INITIALIZED",
    entityType: "WORKSPACE",
    entityId: "ws-nexus-01",
    details: "Initial workspace parameters and security baseline configured.",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "aud-2",
    actorName: "Elena Rostova",
    action: "INCIDENT_ACKNOWLEDGED",
    entityType: "INCIDENT",
    entityId: "inc-8041",
    details: "Acknowledged highway closure on I-80 Cheyenne Pass.",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-3",
    actorName: "Marcus Vance",
    action: "SIMULATION_EXECUTED",
    entityType: "SIMULATION",
    entityId: "sim-901",
    details: "Calculated 135 min savings on hypothetical I-70 South Reroute.",
    createdAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_USERS: UserItem[] = [
  {
    id: "usr-1",
    name: "Devon Sterling",
    email: "admin@nexus.ops",
    role: "ADMINISTRATOR",
    department: "Platform Architecture & Governance",
    active: true,
    lastActive: "Active now",
  },
  {
    id: "usr-2",
    name: "Sarah Chen",
    email: "sarah.chen@nexus.ops",
    role: "OPERATIONS_MANAGER",
    department: "Fleet & Dispatch Command",
    active: true,
    lastActive: "5m ago",
  },
  {
    id: "usr-3",
    name: "Marcus Vance",
    email: "marcus.vance@nexus.ops",
    role: "ANALYST",
    department: "Simulation & Intelligence",
    active: true,
    lastActive: "12m ago",
  },
  {
    id: "usr-4",
    name: "Elena Rostova",
    email: "elena.rostova@nexus.ops",
    role: "OPERATOR",
    department: "Live Telemetry Desk",
    active: true,
    lastActive: "2m ago",
  },
];

export const INITIAL_PIPELINE: PipelineHealthItem[] = [
  {
    id: "pl-1",
    sourceName: "Realtime Vehicle Telemetry Ingestion",
    sourceType: "TELEMETRY_INGESTION",
    status: "HEALTHY",
    latencyMs: 14,
    throughputPerSec: 3200,
    recordsToday: 2450000,
    errorCount: 0,
    lastSyncAt: "Just now",
  },
  {
    id: "pl-2",
    sourceName: "Azure IoT Fleet Edge Bridge",
    sourceType: "AZURE_IOT_HUB",
    status: "HEALTHY",
    latencyMs: 22,
    throughputPerSec: 1800,
    recordsToday: 1200000,
    errorCount: 1,
    lastSyncAt: "2s ago",
  },
  {
    id: "pl-3",
    sourceName: "Microsoft Fabric OneLake Delta Sync",
    sourceType: "FABRIC_DELTA_LAKE",
    status: "HEALTHY",
    latencyMs: 45,
    throughputPerSec: 950,
    recordsToday: 4800000,
    errorCount: 0,
    lastSyncAt: "5s ago",
  },
  {
    id: "pl-4",
    sourceName: "Neon PostgreSQL Operational Stream",
    sourceType: "POSTGRES_STREAM",
    status: "HEALTHY",
    latencyMs: 8,
    throughputPerSec: 4100,
    recordsToday: 3100000,
    errorCount: 0,
    lastSyncAt: "Just now",
  },
];
