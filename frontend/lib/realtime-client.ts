import { eventBus } from "./event-bus";
import { useAvatarStore } from "./avatar-store";

export interface NexusPulseItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  timestamp: string;
  changeContext?: {
    entityType: string;
    entityId: string;
    previousState?: string | number;
    currentState?: string | number;
    delta?: string | number;
    cause?: string;
  };
}

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: any = null;
  private heartbeatTimeout: any = null;
  private reconnectAttempts = 0;
  private pulseListeners: Set<(item: NexusPulseItem) => void> = new Set();
  private pulseHistory: NexusPulseItem[] = [];
  private isConnected = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initConnection();
    }
  }

  private resetHeartbeatWatchdog() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    // If no SSE pulse/ping is received within 45 seconds, reconnect stream safely
    this.heartbeatTimeout = setTimeout(() => {
      console.warn("[NEXUS Realtime] SSE Heartbeat watchdog timeout. Reconnecting...");
      this.initConnection();
    }, 45000);
  }

  public initConnection() {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    this.disconnect();

    const streamUrl = "/api/v1/realtime/stream";

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.resetHeartbeatWatchdog();
        console.log("[NEXUS Realtime] SSE connection established to:", streamUrl);
      };

      this.eventSource.onmessage = (e) => {
        this.resetHeartbeatWatchdog();
        try {
          const payload = JSON.parse(e.data);
          this.handleIncomingEvent(payload);
        } catch (err) {
          console.error("[NEXUS Realtime] Error parsing event payload:", err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.disconnect();

        // Calculate exponential backoff retry delay (1s, 2s, 4s, 8s, up to 30s)
        const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
        this.reconnectAttempts++;

        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.initConnection();
          }, delay);
        }
      };
    } catch (err) {
      console.warn("[NEXUS Realtime] Could not initialize SSE stream:", err);
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  private handleIncomingEvent(msg: { type: string; timestamp: string; data?: any }) {
    const { type, data, timestamp } = msg;
    if (!type || type === "CONNECTION_ESTABLISHED") return;

    // Publish to local event bus under both lowercase topic and raw type
    eventBus.publish(type.toLowerCase(), data);
    if (type !== type.toLowerCase()) {
      eventBus.publish(type, data);
    }

    // Convert technical domain event into NEXUS Pulse narrative
    let pulseItem: NexusPulseItem | null = null;

    switch (type) {
      case "INCIDENT_CREATED":
        useAvatarStore.getState().triggerEvent("CRITICAL_INCIDENT");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "New Anomaly Triaged",
          message: `${data?.code || "Incident"}: ${data?.title || "Alert detected"} affecting ${data?.affectedEntity || "fleet"}.`,
          severity: data?.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
          timestamp,
          changeContext: {
            entityType: "INCIDENT",
            entityId: data?.id || "",
            currentState: "DETECTED",
            cause: data?.title,
          },
        };
        break;

      case "INCIDENT_STATUS_CHANGED":
        if (data?.status === "RESOLVED" || data?.status === "ACTION_APPLIED") {
          useAvatarStore.getState().triggerEvent("DECISION_APPLIED");
        }
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Incident Status Advanced",
          message: `${data?.code || "Incident"} transitioned to ${data?.status}. ${data?.note || ""}`,
          severity: "INFO",
          timestamp,
          changeContext: {
            entityType: "INCIDENT",
            entityId: data?.id || "",
            currentState: data?.status,
            cause: data?.actor ? `Action by ${data.actor}` : undefined,
          },
        };
        break;

      case "SIMULATION_EVALUATED":
        useAvatarStore.getState().triggerEvent("SIMULATION_COMPLETED");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Simulation Scenario Evaluated",
          message: `Scenario ${data?.code || ""}: ${data?.verdict || "Computed"}. Projected delay recovery of +${data?.netTimeSavedMins || 0} mins.`,
          severity: "INFO",
          timestamp,
          changeContext: {
            entityType: "SIMULATION",
            entityId: data?.id || "",
            delta: `+${data?.netTimeSavedMins || 0} mins recovered`,
            cause: "Deterministic algorithm execution",
          },
        };
        break;

      case "DECISION_APPLIED":
        useAvatarStore.getState().triggerEvent("DECISION_APPLIED");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Decision Applied to Live Fleet",
          message: `Scenario ${data?.simulationCode || ""} applied by ${data?.actorName || "Operator"}. Delay reduced by ${data?.netTimeSavedMins || 135} mins with confirmed route change.`,
          severity: "SUCCESS",
          timestamp,
          changeContext: {
            entityType: "VEHICLE",
            entityId: data?.vehicleId || "NX-104",
            previousState: "HOLDING_PASS_CLOSURE",
            currentState: "I-70_SOUTH_BYPASS",
            delta: `-${data?.netTimeSavedMins || 135} mins delay`,
            cause: data?.actorName ? `Authorized by ${data.actorName}` : "Authorized by workspace operator",
          },
        };
        break;

      case "VEHICLE_UPDATED":
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Vehicle Status Synchronized",
          message: `Vehicle ${data?.code || "Fleet asset"} status updated to ${data?.status || "ACTIVE"}.`,
          severity: "INFO",
          timestamp,
          changeContext: {
            entityType: "VEHICLE",
            entityId: data?.id || "",
            currentState: data?.status,
          },
        };
        break;

      case "VEHICLE_TELEMETRY_UPDATED":
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: `Telemetry: ${data?.code || "Asset"}`,
          message: `Vehicle ${data?.code || "Unit"} streaming: ${data?.speed_kmh != null ? Math.round(data.speed_kmh) : 0} km/h, Bat ${data?.battery_pct ?? 100}% at (${data?.lat?.toFixed(3)}, ${data?.lng?.toFixed(3)}).`,
          severity: (data?.battery_pct != null && data.battery_pct < 20) ? "WARNING" : "INFO",
          timestamp,
          changeContext: {
            entityType: "VEHICLE",
            entityId: data?.vehicle_id || data?.id || "",
            currentState: data?.status || "IN_TRANSIT",
            delta: `${data?.speed_kmh != null ? Math.round(data.speed_kmh) : 0} km/h`,
            cause: "Live GPS telemetry ping",
          },
        };
        break;

      case "TRIP_DISPATCHED":
        useAvatarStore.getState().triggerEvent("DECISION_APPLIED");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Trip Dispatched to Commercial Fleet",
          message: `Trip ${data?.trip_number || data?.id || ""} for vehicle ${data?.vehicle_code || "Unit"} dispatched by operations. Driver pass active.`,
          severity: "SUCCESS",
          timestamp,
          changeContext: {
            entityType: "TRIP",
            entityId: data?.id || "",
            currentState: "DISPATCHED",
            cause: data?.driver_name ? `Assigned to ${data.driver_name}` : "Trip authorization",
          },
        };
        break;

      case "ORDER_UPDATED":
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Consignment Order Updated",
          message: `Order #${data?.order_number || data?.id || ""} transitioned to ${data?.status || "UPDATED"}.`,
          severity: "INFO",
          timestamp,
          changeContext: {
            entityType: "ORDER",
            entityId: data?.id || "",
            currentState: data?.status,
            cause: "Operational dispatch modification",
          },
        };
        break;

      case "DOCK_ARRIVAL_DETECTED":
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Geofence Dock Arrival Detected",
          message: `Vehicle ${data?.vehicle_code || data?.vehicle_id} entered unloading dock geofence at ${data?.warehouse_name || "Destination Hub"}. Free window started (120m).`,
          severity: "INFO",
          timestamp,
          changeContext: {
            entityType: "TRIP",
            entityId: data?.trip_id || "",
            currentState: "ARRIVED_DOCK",
            delta: `${data?.distance_meters ? Math.round(data.distance_meters) : 0}m radius`,
            cause: "500m geofence crossing",
          },
        };
        break;

      case "DOCK_DWELL_WARNING":
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Dock Dwell Threshold Warning",
          message: `Vehicle ${data?.vehicle_code || data?.vehicle_id} has dwelled at ${data?.warehouse_name || "Dock"} for ${data?.wait_minutes} mins. ${data?.remaining_free_minutes || 0} mins remaining before billable detention.`,
          severity: "WARNING",
          timestamp,
          changeContext: {
            entityType: "TRIP",
            entityId: data?.trip_id || "",
            currentState: "DWELL_WARNING",
            delta: `${data?.wait_minutes}m wait`,
            cause: ">90 min dock dwell duration",
          },
        };
        break;

      case "DETENTION_ACCRUING":
        useAvatarStore.getState().triggerEvent("CRITICAL_INCIDENT");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Active Dock Detention Accruing",
          message: `Detention clock active for vehicle ${data?.vehicle_code || data?.vehicle_id} at ${data?.warehouse_name || "Dock"}! Total wait: ${data?.wait_minutes}m (${data?.detention_minutes}m billable, ₹${data?.estimated_charge_inr || 0}).`,
          severity: "CRITICAL",
          timestamp,
          changeContext: {
            entityType: "TRIP",
            entityId: data?.trip_id || "",
            currentState: "DETENTION_ACCRUING",
            delta: `₹${data?.estimated_charge_inr || 0}`,
            cause: ">120m dock detention threshold breach",
          },
        };
        break;

      case "PROOF_OF_DELIVERY_SUBMITTED":
        useAvatarStore.getState().triggerEvent("DECISION_APPLIED");
        pulseItem = {
          id: `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventType: type,
          title: "Proof of Delivery Submitted",
          message: `Signed ePOD uploaded for vehicle ${data?.vehicle_code || "Unit"}. Dock detention clock stopped. Consignment delivered.`,
          severity: "SUCCESS",
          timestamp,
          changeContext: {
            entityType: "ORDER",
            entityId: data?.order_id || "",
            currentState: "DELIVERED",
            cause: "Consignee signature captured in Driver Pass",
          },
        };
        break;

      default:
        break;
    }

    if (pulseItem) {
      this.pulseHistory.unshift(pulseItem);
      if (this.pulseHistory.length > 50) this.pulseHistory.pop();
      this.pulseListeners.forEach((listener) => listener(pulseItem!));
    }
  }

  public subscribePulse(callback: (item: NexusPulseItem) => void): () => void {
    this.pulseListeners.add(callback);
    return () => this.pulseListeners.delete(callback);
  }

  public getPulseHistory(): NexusPulseItem[] {
    return [...this.pulseHistory];
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const realtimeClient = new RealtimeClient();
