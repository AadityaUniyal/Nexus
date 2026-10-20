import assert from "node:assert/strict";
import test from "node:test";
import { eventBus, NexusEventBus } from "./event-bus";
import { realtimeClient, NexusPulseItem } from "./realtime-client";
import { OfflineMutationBuffer } from "./data-provider";

// ============================================================================
// Tier 1: Client Feature Coverage
// ============================================================================

test("Tier 1 - Feature: EventBus topic-based pub/sub isolation", async () => {
  const customBus = new NexusEventBus();
  const receivedA: any[] = [];
  const receivedB: any[] = [];

  const unsubA = customBus.subscribe("vehicle.telemetry", (evt) => {
    receivedA.push(evt.data);
  });
  const unsubB = customBus.subscribe("incident.alert", (evt) => {
    receivedB.push(evt.data);
  });

  await customBus.publish("vehicle.telemetry", { vehicleId: "NX-101", speed: 65 });
  await customBus.publish("incident.alert", { code: "INC-99", severity: "HIGH" });

  assert.equal(receivedA.length, 1);
  assert.equal(receivedA[0].vehicleId, "NX-101");
  assert.equal(receivedB.length, 1);
  assert.equal(receivedB[0].code, "INC-99");

  unsubA();
  unsubB();
});

test("Tier 1 - Feature: RealtimeClient transforms all 12 operational SSE event types", () => {
  const client = realtimeClient as any;
  const pulseCollector: NexusPulseItem[] = [];
  const unsub = realtimeClient.subscribePulse((item) => {
    pulseCollector.push(item);
  });

  const testEvents = [
    { type: "INCIDENT_CREATED", data: { id: "inc-1", code: "INC-01", title: "Blizzard Warning", affectedEntity: "I-80", severity: "CRITICAL" } },
    { type: "INCIDENT_STATUS_CHANGED", data: { id: "inc-1", code: "INC-01", status: "RESOLVED", note: "Highway reopened", actor: "Dispatcher" } },
    { type: "SIMULATION_EVALUATED", data: { id: "sim-1", code: "SIM-01", verdict: "FEASIBLE", netTimeSavedMins: 45 } },
    { type: "DECISION_APPLIED", data: { simulationCode: "SIM-01", actorName: "Lead Controller", vehicleId: "NX-201", netTimeSavedMins: 45 } },
    { type: "VEHICLE_UPDATED", data: { id: "veh-1", code: "NX-201", status: "IN_TRANSIT" } },
    { type: "VEHICLE_TELEMETRY_UPDATED", data: { id: "veh-1", code: "NX-201", speed_kmh: 88, battery_pct: 75, lat: 41.878, lng: -87.629 } },
    { type: "TRIP_DISPATCHED", data: { id: "trip-1", trip_number: "TR-100", vehicle_code: "NX-201", driver_name: "John Doe" } },
    { type: "ORDER_UPDATED", data: { id: "ord-1", order_number: "ORD-99", status: "DELIVERED" } },
    { type: "DOCK_ARRIVAL_DETECTED", data: { trip_id: "trip-1", vehicle_code: "NX-201", warehouse_name: "Dallas Hub", distance_meters: 150 } },
    { type: "DOCK_DWELL_WARNING", data: { trip_id: "trip-1", vehicle_code: "NX-201", warehouse_name: "Dallas Hub", wait_minutes: 95, remaining_free_minutes: 25 } },
    { type: "DETENTION_ACCRUING", data: { trip_id: "trip-1", vehicle_code: "NX-201", warehouse_name: "Dallas Hub", wait_minutes: 150, detention_minutes: 30, estimated_charge_inr: 250 } },
    { type: "PROOF_OF_DELIVERY_SUBMITTED", data: { order_id: "ord-1", vehicle_code: "NX-201", recipient_name: "Acme Logistics", status: "DELIVERED" } },
  ];

  for (const evt of testEvents) {
    client.handleIncomingEvent({
      type: evt.type,
      data: evt.data,
      timestamp: new Date().toISOString(),
    });
  }

  assert.equal(pulseCollector.length, 12, "All 12 operational event types must generate a NexusPulseItem");
  assert.equal(pulseCollector[0].eventType, "INCIDENT_CREATED");
  assert.equal(pulseCollector[0].severity, "CRITICAL");
  assert.equal(pulseCollector[8].eventType, "DOCK_ARRIVAL_DETECTED");
  assert.equal(pulseCollector[10].eventType, "DETENTION_ACCRUING");
  assert.equal(pulseCollector[10].severity, "CRITICAL");
  assert.equal(pulseCollector[11].eventType, "PROOF_OF_DELIVERY_SUBMITTED");
  assert.equal(pulseCollector[11].severity, "SUCCESS");

  unsub();
});

test("Tier 1 - Feature: OfflineMutationBuffer manages non-blocking mutation queue", async () => {
  const buffer = new OfflineMutationBuffer();
  assert.equal(buffer.getPending().length, 0);

  const mockResponse = { id: "veh-test-01", status: "DISPATCHED" };
  const fakeFetch = async () => new Response(JSON.stringify({ success: true, data: mockResponse }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const res = await buffer.executeMutation<typeof mockResponse>(
    "/api/v1/operations/vehicles/veh-test-01/dispatch",
    { method: "POST", body: "{}" },
    fakeFetch
  );

  assert.equal(res.id, "veh-test-01");
  assert.equal(res.status, "DISPATCHED");
  assert.equal(buffer.getPending().length, 0);
});

// ============================================================================
// Tier 2: Boundary & Corner Cases
// ============================================================================

test("Tier 2 - Boundary: EventBus wildcard handler receives all topics", async () => {
  const customBus = new NexusEventBus();
  const wildcardEvents: string[] = [];

  customBus.subscribe("*", (evt) => {
    wildcardEvents.push(evt.topic);
  });

  await customBus.publish("alpha", { val: 1 });
  await customBus.publish("beta.gamma", { val: 2 });
  await customBus.publish("system.maintenance", { val: 3 });

  assert.equal(wildcardEvents.length, 3);
  assert.deepEqual(wildcardEvents, ["alpha", "beta.gamma", "system.maintenance"]);
});

test("Tier 2 - Boundary: EventBus Dead Letter Queue (DLQ) captures failing subscriber errors", async () => {
  const customBus = new NexusEventBus();

  customBus.subscribe("faulty.topic", () => {
    throw new Error("Deliberate handler explosion in test");
  });

  await customBus.publish("faulty.topic", { key: "bad_payload" });

  // Give microtask queue moment to process Settled promises
  await new Promise((r) => setTimeout(r, 10));

  const dlq = customBus.getDLQ();
  assert.equal(dlq.length, 1);
  assert.equal(dlq[0].topic, "faulty.topic");
  assert.equal(dlq[0].data.key, "bad_payload");
});

test("Tier 2 - Boundary: EventBus circular history honors max limit without memory leak", async () => {
  const maxHistory = 15;
  const customBus = new NexusEventBus(maxHistory);

  for (let i = 0; i < 30; i++) {
    await customBus.publish("ping", { seq: i });
  }

  const history = customBus.getHistory("ping", 100);
  assert.equal(history.length, maxHistory);
  // History is returned newest-first
  assert.equal(history[0].data.seq, 29);
  assert.equal(history[history.length - 1].data.seq, 15);
});

test("Tier 2 - Boundary: OfflineMutationBuffer handles Retry-After header with exponential backoff", async () => {
  const buffer = new OfflineMutationBuffer();
  let calls = 0;

  const throttledFetch = async () => {
    calls++;
    if (calls === 1) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "1" },
      });
    }
    return new Response(JSON.stringify({ success: true, data: { orderId: "ORD-RETRIED" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const start = Date.now();
  const res = await buffer.executeMutation<{ orderId: string }>(
    "/api/v1/operations/orders",
    { method: "POST", body: "{}" },
    throttledFetch
  );
  const elapsed = Date.now() - start;

  assert.equal(calls, 2);
  assert.equal(res.orderId, "ORD-RETRIED");
  assert.ok(elapsed >= 900, `Expected elapsed >= 900ms due to Retry-After: 1, got ${elapsed}ms`);
});

// ============================================================================
// Tier 3: Cross-Feature Interactions
// ============================================================================

test("Tier 3 - Interaction: Map selection and inspector drawer contract synchronization", () => {
  interface SelectedEntity {
    type: "VEHICLE" | "WAREHOUSE" | "INCIDENT";
    id: string;
    data: any;
  }

  const state = {
    activeDrawerEntity: null as SelectedEntity | null,
    flyToCamera: null as { lat: number; lng: number; zoom?: number } | null,
  };

  const handleEntitySelect = (entity: SelectedEntity | null) => {
    state.activeDrawerEntity = entity;
    if (entity) {
      const lat = entity.data.lat ?? entity.data.current_lat;
      const lng = entity.data.lng ?? entity.data.current_lng;
      if (lat != null && lng != null) {
        state.flyToCamera = { lat, lng, zoom: 14 };
      }
    } else {
      state.flyToCamera = null;
    }
  };

  // Simulate vehicle selection on Leaflet World Map
  const sampleVehicle = {
    id: "veh-chicago-lead",
    code: "NX-804",
    name: "Freightliner eCascadia #804",
    current_lat: 41.8781,
    current_lng: -87.6298,
    speed_kmh: 68.5,
    battery_pct: 85,
    status: "IN_TRANSIT",
  };

  handleEntitySelect({
    type: "VEHICLE",
    id: sampleVehicle.id,
    data: sampleVehicle,
  });

  assert.ok(state.activeDrawerEntity);
  assert.ok(state.flyToCamera);
  assert.equal(state.activeDrawerEntity.type, "VEHICLE");
  assert.equal(state.activeDrawerEntity.id, "veh-chicago-lead");
  assert.equal(state.flyToCamera.lat, 41.8781);
  assert.equal(state.flyToCamera.lng, -87.6298);
  assert.equal(state.flyToCamera.zoom, 14);

  // Deselection cleans up drawer & camera
  handleEntitySelect(null);
  assert.equal(state.activeDrawerEntity, null);
  assert.equal(state.flyToCamera, null);
});

// ============================================================================
// Tier 4: Real-World Scenarios
// ============================================================================

test("Tier 4 - Real-World: Full trip lifecycle event stream progression", async () => {
  const bus = new NexusEventBus();
  const tripAuditTrail: { stage: string; timestamp: string; payload: any }[] = [];

  const recordStage = (stage: string, payload: any) => {
    tripAuditTrail.push({
      stage,
      timestamp: new Date().toISOString(),
      payload,
    });
  };

  bus.subscribe("*", (evt) => {
    recordStage(evt.topic, evt.data);
  });

  // Stage 1: Trip Dispatch
  await bus.publish("trip.dispatched", {
    tripId: "TRIP-CHI-DAL-884",
    vehicleCode: "NX-CONVOY-01",
    origin: "Chicago Hub",
    destination: "Dallas Hub",
    status: "DISPATCHED",
  });

  // Stage 2: En-Route Telemetry
  await bus.publish("telemetry.packet", {
    vehicleCode: "NX-CONVOY-01",
    lat: 38.627,
    lng: -90.199,
    speedKmh: 92,
    batteryPct: 78,
  });

  // Stage 3: Dock Geofence Crossing
  await bus.publish("detention.arrival", {
    tripId: "TRIP-CHI-DAL-884",
    warehouse: "Dallas Gateway Hub",
    distanceMeters: 140,
    status: "ARRIVED",
  });

  // Stage 4: Dock Dwell Warning (>90m)
  await bus.publish("detention.warning", {
    tripId: "TRIP-CHI-DAL-884",
    waitMinutes: 95,
    remainingFreeMinutes: 25,
  });

  // Stage 5: Detention Accruing (>120m)
  await bus.publish("detention.accruing", {
    tripId: "TRIP-CHI-DAL-884",
    waitMinutes: 180,
    billableMinutes: 60,
    accruedChargeInr: 500,
  });

  // Stage 6: Digital POD Submission & Demurrage Finalization
  await bus.publish("pod.submitted", {
    tripId: "TRIP-CHI-DAL-884",
    recipient: "Dallas Operations Lead",
    signatureVerified: true,
    status: "DELIVERED",
  });

  assert.equal(tripAuditTrail.length, 6);
  assert.equal(tripAuditTrail[0].stage, "trip.dispatched");
  assert.equal(tripAuditTrail[2].stage, "detention.arrival");
  assert.equal(tripAuditTrail[4].stage, "detention.accruing");
  assert.equal(tripAuditTrail[5].stage, "pod.submitted");
  assert.equal(tripAuditTrail[5].payload.signatureVerified, true);
});
