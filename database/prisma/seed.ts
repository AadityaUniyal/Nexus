import { PrismaClient, Role, VehicleStatus, IncidentSeverity, IncidentStatus, OrderPriority, OrderStatus, SimulationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NEXUS Operational Intelligence Platform deterministic data...');

  // 1. Clean existing records if any
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.operationalEvent.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.incidentTimeline.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.order.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.route.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dataPipelineHealth.deleteMany();
  await prisma.workspace.deleteMany();

  // 2. Create Workspace
  const ws = await prisma.workspace.create({
    data: {
      name: 'NEXUS Central Operations Hub',
      code: 'WS-NEXUS-01',
      region: 'North America Central',
      settings: {
        theme: 'WARM_INDUSTRIAL',
        refreshIntervalSec: 5,
        aiAssistanceEnabled: true,
        simulationAutoSave: true,
      },
    },
  });

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: 'admin@nexus.ops',
      name: 'Devon Sterling',
      password: 'nexus-demo-password',
      role: Role.ADMINISTRATOR,
      department: 'Platform Architecture & Governance',
      lastActive: new Date(),
    },
  });

  const opsUser = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: 'sarah.chen@nexus.ops',
      name: 'Sarah Chen',
      password: 'nexus-demo-password',
      role: Role.OPERATIONS_MANAGER,
      department: 'Fleet & Dispatch Command',
      lastActive: new Date(),
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: 'marcus.vance@nexus.ops',
      name: 'Marcus Vance',
      password: 'nexus-demo-password',
      role: Role.ANALYST,
      department: 'Simulation & Intelligence',
      lastActive: new Date(),
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: 'elena.rostova@nexus.ops',
      name: 'Elena Rostova',
      password: 'nexus-demo-password',
      role: Role.OPERATOR,
      department: 'Live Telemetry Desk',
      lastActive: new Date(),
    },
  });

  // 4. Create Warehouses
  const whChi = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-CHI',
      name: 'Chicago Central Logistics Hub',
      city: 'Chicago',
      state: 'IL',
      lat: 41.8781,
      lng: -87.6298,
      capacityUnits: 15000,
      currentUnits: 12450,
      dockCount: 24,
      activeDocks: 19,
      efficiencyPct: 96.4,
      status: 'OPERATIONAL',
    },
  });

  const whDfw = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-DFW',
      name: 'Dallas-Fort Worth Freight Center',
      city: 'Dallas',
      state: 'TX',
      lat: 32.7767,
      lng: -96.7970,
      capacityUnits: 18000,
      currentUnits: 14200,
      dockCount: 28,
      activeDocks: 22,
      efficiencyPct: 94.8,
      status: 'OPERATIONAL',
    },
  });

  const whAtl = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-ATL',
      name: 'Atlanta Gateway Superhub',
      city: 'Atlanta',
      state: 'GA',
      lat: 33.7490,
      lng: -84.3880,
      capacityUnits: 14000,
      currentUnits: 11100,
      dockCount: 20,
      activeDocks: 16,
      efficiencyPct: 91.2,
      status: 'ATTENTION',
    },
  });

  const whDen = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-DEN',
      name: 'Denver Mountain Terminal',
      city: 'Denver',
      state: 'CO',
      lat: 39.7392,
      lng: -104.9903,
      capacityUnits: 10000,
      currentUnits: 7200,
      dockCount: 16,
      activeDocks: 12,
      efficiencyPct: 97.1,
      status: 'OPERATIONAL',
    },
  });

  const whSea = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-SEA',
      name: 'Seattle Puget Sound Depot',
      city: 'Seattle',
      state: 'WA',
      lat: 47.6062,
      lng: -122.3321,
      capacityUnits: 12000,
      currentUnits: 8900,
      dockCount: 18,
      activeDocks: 14,
      efficiencyPct: 95.5,
      status: 'OPERATIONAL',
    },
  });

  const whNyc = await prisma.warehouse.create({
    data: {
      workspaceId: ws.id,
      code: 'WH-NYC',
      name: 'New York Metro Fulfilment Hub',
      city: 'Newark',
      state: 'NJ',
      lat: 40.7357,
      lng: -74.1724,
      capacityUnits: 20000,
      currentUnits: 17800,
      dockCount: 32,
      activeDocks: 28,
      efficiencyPct: 93.6,
      status: 'OPERATIONAL',
    },
  });

  // 5. Create Routes
  const rtChiDen = await prisma.route.create({
    data: {
      workspaceId: ws.id,
      code: 'RT-CHI-DEN-01',
      name: 'I-80 West Continental Corridor',
      originWarehouseId: whChi.id,
      destWarehouseId: whDen.id,
      distanceKm: 1620.0,
      avgDurationMins: 940,
      riskScore: 78.5, // Incident flagged
      trafficCondition: 'SEVERE_WEATHER_ALERT',
      waypointsJson: [
        { lat: 41.8781, lng: -87.6298, label: 'Chicago Origin' },
        { lat: 41.5868, lng: -93.6250, label: 'Des Moines Waypoint' },
        { lat: 41.2565, lng: -95.9345, label: 'Omaha Waypoint' },
        { lat: 41.1400, lng: -104.8202, label: 'Cheyenne Pass (Snow Delay)' },
        { lat: 39.7392, lng: -104.9903, label: 'Denver Destination' },
      ],
    },
  });

  const rtChiNyc = await prisma.route.create({
    data: {
      workspaceId: ws.id,
      code: 'RT-CHI-NYC-01',
      name: 'I-80 / I-76 East Express',
      originWarehouseId: whChi.id,
      destWarehouseId: whNyc.id,
      distanceKm: 1270.0,
      avgDurationMins: 760,
      riskScore: 14.2,
      trafficCondition: 'CLEAR',
      waypointsJson: [
        { lat: 41.8781, lng: -87.6298, label: 'Chicago Origin' },
        { lat: 41.4993, lng: -81.6944, label: 'Cleveland Rest Hub' },
        { lat: 40.4406, lng: -79.9959, label: 'Pittsburgh Waypoint' },
        { lat: 40.7357, lng: -74.1724, label: 'Newark Destination' },
      ],
    },
  });

  const rtDfwAtl = await prisma.route.create({
    data: {
      workspaceId: ws.id,
      code: 'RT-DFW-ATL-01',
      name: 'I-20 Southern Transverse',
      originWarehouseId: whDfw.id,
      destWarehouseId: whAtl.id,
      distanceKm: 1250.0,
      avgDurationMins: 720,
      riskScore: 18.0,
      trafficCondition: 'MODERATE_TRAFFIC',
      waypointsJson: [
        { lat: 32.7767, lng: -96.7970, label: 'Dallas Origin' },
        { lat: 32.5252, lng: -93.7502, label: 'Shreveport Waypoint' },
        { lat: 32.2988, lng: -90.1848, label: 'Jackson Waypoint' },
        { lat: 33.7490, lng: -84.3880, label: 'Atlanta Destination' },
      ],
    },
  });

  const rtSeaDen = await prisma.route.create({
    data: {
      workspaceId: ws.id,
      code: 'RT-SEA-DEN-01',
      name: 'I-84 / I-80 Northwest Line',
      originWarehouseId: whSea.id,
      destWarehouseId: whDen.id,
      distanceKm: 2100.0,
      avgDurationMins: 1240,
      riskScore: 22.4,
      trafficCondition: 'CLEAR',
    },
  });

  // 6. Create Vehicles
  const v104 = await prisma.vehicle.create({
    data: {
      workspaceId: ws.id,
      code: 'NX-TRK-104',
      name: 'Nexus Alpha Hauler 104',
      model: 'Freightliner eCascadia Long-Range',
      driverName: 'Robert Langdon',
      driverPhone: '+1 (312) 555-0184',
      capacityKg: 20000,
      currentLoadKg: 16800,
      batteryPct: 64.5,
      healthScore: 92.0,
      speedKmh: 42.0, // slowed due to storm
      lat: 41.1400,
      lng: -104.8202,
      heading: 245.0,
      status: VehicleStatus.IN_TRANSIT,
      currentRouteId: rtChiDen.id,
    },
  });

  const v109 = await prisma.vehicle.create({
    data: {
      workspaceId: ws.id,
      code: 'NX-TRK-109',
      name: 'Nexus Cryo-Express 109',
      model: 'Volvo VNR Electric Refrig-Unit',
      driverName: 'Maya Lin',
      driverPhone: '+1 (214) 555-0199',
      capacityKg: 15000,
      currentLoadKg: 11200,
      batteryPct: 88.0,
      healthScore: 78.4, // thermal alarm
      speedKmh: 74.0,
      lat: 32.4500,
      lng: -92.2000,
      heading: 85.0,
      status: VehicleStatus.IN_TRANSIT,
      currentRouteId: rtDfwAtl.id,
    },
  });

  const v112 = await prisma.vehicle.create({
    data: {
      workspaceId: ws.id,
      code: 'NX-TRK-112',
      name: 'Nexus High-Cube Carrier 112',
      model: 'Tesla Semi Commercial Class-8',
      driverName: 'Arthur Pendelton',
      driverPhone: '+1 (404) 555-0112',
      capacityKg: 22000,
      currentLoadKg: 19400,
      batteryPct: 91.5,
      healthScore: 99.1,
      speedKmh: 88.0,
      lat: 41.3000,
      lng: -80.5000,
      heading: 105.0,
      status: VehicleStatus.IN_TRANSIT,
      currentRouteId: rtChiNyc.id,
    },
  });

  const v115 = await prisma.vehicle.create({
    data: {
      workspaceId: ws.id,
      code: 'NX-TRK-115',
      name: 'Nexus Cascade Transporter 115',
      model: 'Freightliner eCascadia Eco',
      driverName: 'Chloe Bennett',
      driverPhone: '+1 (206) 555-0115',
      capacityKg: 18000,
      currentLoadKg: 9400,
      batteryPct: 76.0,
      healthScore: 96.8,
      speedKmh: 82.0,
      lat: 44.5000,
      lng: -115.8000,
      heading: 135.0,
      status: VehicleStatus.IN_TRANSIT,
      currentRouteId: rtSeaDen.id,
    },
  });

  const v120 = await prisma.vehicle.create({
    data: {
      workspaceId: ws.id,
      code: 'NX-TRK-120',
      name: 'Nexus Metro Feeder 120',
      model: 'Mercedes-Benz eActros 400',
      driverName: 'Carlos Gomez',
      driverPhone: '+1 (973) 555-0120',
      capacityKg: 12000,
      currentLoadKg: 0,
      batteryPct: 100.0,
      healthScore: 100.0,
      speedKmh: 0.0,
      lat: 40.7357,
      lng: -74.1724,
      heading: 0.0,
      status: VehicleStatus.IDLE,
      currentRouteId: null,
    },
  });

  // 7. Create Orders
  await prisma.order.createMany({
    data: [
      {
        workspaceId: ws.id,
        orderNumber: 'ORD-2026-9041',
        customerName: 'AeroTech Avionics Corp',
        destination: 'Denver Tech Center, CO',
        priority: OrderPriority.CRITICAL,
        status: OrderStatus.DELAYED,
        warehouseId: whChi.id,
        routeId: rtChiDen.id,
        vehicleId: v104.id,
        deadline: new Date(Date.now() + 4 * 3600 * 1000), // in 4 hours
        estimatedEta: new Date(Date.now() + 7 * 3600 * 1000), // ETA delayed
        itemsCount: 84,
        totalCost: 14500.0,
        slaCompliant: false,
      },
      {
        workspaceId: ws.id,
        orderNumber: 'ORD-2026-9042',
        customerName: 'Vanguard Biopharma Laboratories',
        destination: 'Emory University Medical Center, GA',
        priority: OrderPriority.CRITICAL,
        status: OrderStatus.IN_TRANSIT,
        warehouseId: whDfw.id,
        routeId: rtDfwAtl.id,
        vehicleId: v109.id,
        deadline: new Date(Date.now() + 6 * 3600 * 1000),
        estimatedEta: new Date(Date.now() + 5 * 3600 * 1000),
        itemsCount: 120,
        totalCost: 28900.0,
        slaCompliant: true,
      },
      {
        workspaceId: ws.id,
        orderNumber: 'ORD-2026-9043',
        customerName: 'NorthEast MicroElectronics Inc',
        destination: 'Silicon Alley Logistics Depot, NY',
        priority: OrderPriority.HIGH,
        status: OrderStatus.IN_TRANSIT,
        warehouseId: whChi.id,
        routeId: rtChiNyc.id,
        vehicleId: v112.id,
        deadline: new Date(Date.now() + 12 * 3600 * 1000),
        estimatedEta: new Date(Date.now() + 9 * 3600 * 1000),
        itemsCount: 210,
        totalCost: 18400.0,
        slaCompliant: true,
      },
      {
        workspaceId: ws.id,
        orderNumber: 'ORD-2026-9044',
        customerName: 'Rocky Mountain Renewable Grid',
        destination: 'Fort Collins Industrial Park, CO',
        priority: OrderPriority.NORMAL,
        status: OrderStatus.IN_TRANSIT,
        warehouseId: whSea.id,
        routeId: rtSeaDen.id,
        vehicleId: v115.id,
        deadline: new Date(Date.now() + 24 * 3600 * 1000),
        estimatedEta: new Date(Date.now() + 18 * 3600 * 1000),
        itemsCount: 65,
        totalCost: 9200.0,
        slaCompliant: true,
      },
      {
        workspaceId: ws.id,
        orderNumber: 'ORD-2026-9045',
        customerName: 'Midwest Precision Machining',
        destination: 'Manhattan Distribution Hub, NY',
        priority: OrderPriority.NORMAL,
        status: OrderStatus.ASSIGNED,
        warehouseId: whNyc.id,
        routeId: null,
        vehicleId: v120.id,
        deadline: new Date(Date.now() + 36 * 3600 * 1000),
        estimatedEta: new Date(Date.now() + 28 * 3600 * 1000),
        itemsCount: 40,
        totalCost: 5100.0,
        slaCompliant: true,
      },
    ],
  });

  // 8. Create Live Incidents
  const inc1 = await prisma.incident.create({
    data: {
      workspaceId: ws.id,
      code: 'INC-8041',
      title: 'I-80 Wyoming Pass Severe Snowstorm & Road Closure',
      summary: 'Extreme blizzards and jackknifed trailers on Interstate 80 near Cheyenne Pass have blocked westbound traffic. Transit times increased by ~180 minutes.',
      severity: IncidentSeverity.CRITICAL,
      status: IncidentStatus.INVESTIGATING,
      affectedEntityType: 'ROUTE',
      affectedEntityId: rtChiDen.id,
      affectedEntityName: 'RT-CHI-DEN-01 (I-80 West)',
      rootCause: 'Sudden blizzard event with 45mph winds causing complete highway closure between mile markers 310 and 345.',
      aiAnalysis: 'Recommend immediate reroute of Vehicle NX-TRK-104 via Southern US-40 or I-70 detour to save 125 mins and protect SLA on AeroTech high-value payload.',
      potentialImpact: 'Delay of 180 mins across 14 orders with estimated penalty risk of $4,200.',
      costEstimate: 4200.0,
      ordersAffected: 14,
      delayMinutes: 180,
    },
  });

  await prisma.incidentTimeline.createMany({
    data: [
      {
        incidentId: inc1.id,
        status: IncidentStatus.DETECTED,
        note: 'Automated Weather Telemetry Trigger: Blizzard warning level 4 detected on I-80 corridor.',
        actorName: 'Nexus Environmental Sensor Grid',
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        incidentId: inc1.id,
        status: IncidentStatus.ACKNOWLEDGED,
        note: 'Incident acknowledged by Dispatch Operator Elena Rostova. Flagged for Simulation.',
        actorName: 'Elena Rostova',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        incidentId: inc1.id,
        status: IncidentStatus.INVESTIGATING,
        note: 'Contacted DOT Wyoming Patrol: Highway estimated closed for at least 3.5 hours. Initiating reroute simulation.',
        actorName: 'Sarah Chen',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    ],
  });

  const inc2 = await prisma.incident.create({
    data: {
      workspaceId: ws.id,
      code: 'INC-8042',
      title: 'Cryo-Compressor Secondary Sensor Alert on Vehicle NX-TRK-109',
      summary: 'Secondary temperature probe on refrigerated cargo bay reported +3.2°C drift above target threshold of -20°C for biopharma cargo.',
      severity: IncidentSeverity.HIGH,
      status: IncidentStatus.DETECTED,
      affectedEntityType: 'VEHICLE',
      affectedEntityId: v109.id,
      affectedEntityName: 'NX-TRK-109 (Cryo-Express)',
      rootCause: 'Auxiliary power inverter voltage fluctuation causing secondary condenser cycle drop.',
      aiAnalysis: 'Thermal buffer allows 45 mins before critical threshold breach. Direct driver to nearest certified service depot in Jackson, MS or activate backup nitrogen burst.',
      potentialImpact: 'Risk of cargo spoilage valued at $28,900 if unaddressed within 60 mins.',
      costEstimate: 28900.0,
      ordersAffected: 1,
      delayMinutes: 35,
    },
  });

  await prisma.incidentTimeline.create({
    data: {
      incidentId: inc2.id,
      status: IncidentStatus.DETECTED,
      note: 'IoT Telemetry Breach: Temperature sensor T-02 reported -16.8°C (threshold: -20°C +/- 2°C).',
      actorName: 'ColdChain IoT Telemetry Agent',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  // 9. Create Simulations
  await prisma.simulation.create({
    data: {
      workspaceId: ws.id,
      userId: analystUser.id,
      incidentId: inc1.id,
      code: 'SIM-SCENARIO-901',
      title: 'I-70 South Reroute vs Wait-and-Hold for NX-TRK-104',
      description: 'Hypothetical simulation comparing active I-70 detour (+85 km) vs staying on I-80 holding pattern.',
      status: SimulationStatus.COMPLETED,
      variablesJson: {
        vehicleId: v104.id,
        currentRouteId: rtChiDen.id,
        alternateRouteId: 'I-70-DETOUR-SOUTH',
        speedAdjustmentPct: 10,
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
      },
      aiBriefing: 'Rerouting NX-TRK-104 via the I-70 South corridor saves 135 minutes with minimal $80 operational fuel surcharge. Highly recommended to preserve AeroTech SLA compliance.',
    },
  });

  // 10. Create Operational Events
  await prisma.operationalEvent.createMany({
    data: [
      {
        workspaceId: ws.id,
        eventType: 'vehicle.telemetry',
        entityType: 'VEHICLE',
        entityId: v104.id,
        severity: 'WARNING',
        message: 'Vehicle NX-TRK-104 speed decreased to 42 km/h due to road hazard alert.',
        payloadJson: { speed: 42.0, lat: 41.1400, lng: -104.8202 },
      },
      {
        workspaceId: ws.id,
        eventType: 'incident.created',
        entityType: 'INCIDENT',
        entityId: inc1.id,
        severity: 'CRITICAL',
        message: 'Critical Incident INC-8041 generated for route RT-CHI-DEN-01.',
      },
      {
        workspaceId: ws.id,
        eventType: 'warehouse.capacity',
        entityType: 'WAREHOUSE',
        entityId: whAtl.id,
        severity: 'WARNING',
        message: 'Warehouse WH-ATL dock utilization reached 80% capacity limit.',
      },
      {
        workspaceId: ws.id,
        eventType: 'simulation.completed',
        entityType: 'SIMULATION',
        entityId: 'SIM-SCENARIO-901',
        severity: 'SIMULATION',
        message: 'Simulation SIM-SCENARIO-901 completed with 135 mins net savings.',
      },
      {
        workspaceId: ws.id,
        eventType: 'order.sla_warning',
        entityType: 'ORDER',
        entityId: 'ORD-2026-9041',
        severity: 'CRITICAL',
        message: 'Order ORD-2026-9041 projected SLA breach in 4 hours.',
      },
    ],
  });

  // 11. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: opsUser.id,
        type: 'CRITICAL',
        title: 'Severe Blizzard Alert on I-80 Pass',
        message: 'Route RT-CHI-DEN-01 blocked. 14 orders affected including AeroTech critical shipment.',
        entityType: 'INCIDENT',
        entityId: inc1.id,
        deepLink: `/incidents/${inc1.id}`,
        read: false,
      },
      {
        userId: opsUser.id,
        type: 'ATTENTION',
        title: 'Thermal Unit Drift on NX-TRK-109',
        message: 'Auxiliary condenser temperature deviation (+3.2°C) detected.',
        entityType: 'INCIDENT',
        entityId: inc2.id,
        deepLink: `/incidents/${inc2.id}`,
        read: false,
      },
      {
        userId: opsUser.id,
        type: 'SIMULATION',
        title: 'Simulation Ready: I-70 Detour Analysis',
        message: 'Scenario SIM-SCENARIO-901 shows 135 mins net time recovery.',
        entityType: 'SIMULATION',
        entityId: 'SIM-SCENARIO-901',
        deepLink: `/simulations`,
        read: true,
      },
    ],
  });

  // 12. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorName: adminUser.name,
        action: 'WORKSPACE_INITIALIZED',
        entityType: 'WORKSPACE',
        entityId: ws.id,
        details: 'Initial workspace parameters and security baseline configured.',
      },
      {
        actorId: opsUser.id,
        actorName: opsUser.name,
        action: 'INCIDENT_ACKNOWLEDGED',
        entityType: 'INCIDENT',
        entityId: inc1.id,
        details: 'Acknowledged highway closure on I-80 Cheyenne Pass.',
      },
      {
        actorId: analystUser.id,
        actorName: analystUser.name,
        action: 'SIMULATION_EXECUTED',
        entityType: 'SIMULATION',
        entityId: 'SIM-SCENARIO-901',
        details: 'Calculated 135 min savings on hypothetical I-70 South Reroute.',
      },
    ],
  });

  // 13. Create Data Pipeline Health
  await prisma.dataPipelineHealth.createMany({
    data: [
      {
        sourceName: 'Realtime Vehicle Telemetry Ingestion',
        sourceType: 'TELEMETRY_INGESTION',
        status: 'HEALTHY',
        latencyMs: 14,
        throughputPerSec: 3200,
        recordsToday: 2450000,
        errorCount: 0,
      },
      {
        sourceName: 'Azure IoT Fleet Edge Bridge',
        sourceType: 'AZURE_IOT_HUB',
        status: 'HEALTHY',
        latencyMs: 22,
        throughputPerSec: 1800,
        recordsToday: 1200000,
        errorCount: 1,
      },
      {
        sourceName: 'Microsoft Fabric OneLake Delta Sync',
        sourceType: 'FABRIC_DELTA_LAKE',
        status: 'HEALTHY',
        latencyMs: 45,
        throughputPerSec: 950,
        recordsToday: 4800000,
        errorCount: 0,
      },
      {
        sourceName: 'Neon PostgreSQL Operational Stream',
        sourceType: 'POSTGRES_STREAM',
        status: 'HEALTHY',
        latencyMs: 8,
        throughputPerSec: 4100,
        recordsToday: 3100000,
        errorCount: 0,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
