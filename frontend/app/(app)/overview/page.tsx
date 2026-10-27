"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LeafletWorldMap, MapWarehouse, MapVehicle, MapIncident } from "@/components/map/LeafletWorldMap";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Truck, Building2, AlertTriangle, Package } from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  SimulationItem,
} from "@/lib/mock-data";
import { tactileAudio } from "@/lib/sound-effects";
import {
  FadeIn,
} from "@/components/ui/motion-animations";
import { motion } from "motion/react";
import { dataProvider } from "@/lib/data-provider";
import { realtimeClient } from "@/lib/realtime-client";
import { eventBus } from "@/lib/event-bus";
import { useRouter } from "next/navigation";
import { SkeletonMetricTile, SkeletonCard } from "@/components/ui/skeleton";
import { useAuth, usePermissions } from "@/components/providers/AuthProvider";

// Innovations & Role Cockpits
import { ManagerDashboard } from "@/components/role-dashboards/ManagerDashboard";
import { OperatorDashboard } from "@/components/role-dashboards/OperatorDashboard";
import { AnalystDashboard } from "@/components/role-dashboards/AnalystDashboard";
import { AdminDashboard } from "@/components/role-dashboards/AdminDashboard";
import { ViewerDashboard } from "@/components/role-dashboards/ViewerDashboard";
import { RoleCockpitSwitcher, RoleType, normalizeRole } from "@/components/role-dashboards/RoleCockpitSwitcher";

// Real Role-Driven Input Modals
import { CreateWarehouseModal } from "@/components/forms/CreateWarehouseModal";
import { CreateVehicleModal } from "@/components/forms/CreateVehicleModal";
import { CreateOrderModal } from "@/components/forms/CreateOrderModal";
import { CreateIncidentModal } from "@/components/forms/CreateIncidentModal";
import { ResolvedLocation } from "@/lib/api/endpoints/location";

export default function OverviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canRunSimulations } = usePermissions();
  const canEditOperations = ["ADMINISTRATOR", "OPERATIONS_MANAGER", "DISPATCHER"].includes(user?.role || "");
  const [activeRole, setActiveRole] = React.useState<RoleType>("OPERATIONS_MANAGER");

  React.useEffect(() => {
    if (user?.role) {
      setActiveRole(normalizeRole(user.role));
    }
  }, [user?.role]);

  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);
  const [simulations, setSimulations] = React.useState<SimulationItem[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Modals state
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = React.useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const [clickedMapPoint, setClickedMapPoint] = React.useState<{ lat: number; lng: number } | null>(null);

  // Fetch live state directly from authoritative dataProvider
  const loadLiveTelemetry = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [vData, wData, iData, sData] = await Promise.all([
        dataProvider.getVehicles(),
        dataProvider.getWarehouses(),
        dataProvider.getIncidents(),
        dataProvider.getSimulations(),
      ]);

      setVehicles(vData || []);
      setWarehouses(wData || []);
      setIncidents(iData || []);
      setSimulations(sData || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Operational data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLiveTelemetry();

    // Subscribe to authoritative real-time SSE feed from FastAPI backend
    const unsubscribePulse = realtimeClient.subscribePulse((pulse) => {
      // Ignore high-frequency GPS telemetry updates to eliminate 4-table REST API re-fetch storm
      if (pulse?.eventType === "VEHICLE_TELEMETRY_UPDATED") return;
      loadLiveTelemetry();
    });

    // Reactive eventBus subscriptions to mutate local state immediately without full page reload
    const unsubTelemetry = eventBus.subscribe("vehicle_telemetry_updated", (event) => {
      const data = event.data as any;
      if (!data) return;
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id === data.vehicle_id || v.code === data.vehicle_code) {
            return {
              ...v,
              lat: data.lat ?? v.lat,
              lng: data.lng ?? v.lng,
              speedKmh: data.speed_kmh ?? v.speedKmh,
              heading: data.heading ?? v.heading,
              batteryPct: data.battery_pct ?? v.batteryPct,
              status: data.status ?? v.status,
            };
          }
          return v;
        })
      );
    });

    const unsubDockArrival = eventBus.subscribe("dock_arrival_detected", (event) => {
      const data = event.data as any;
      if (!data) return;
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicle_id || v.code === data.vehicle_code
            ? { ...v, status: "IDLE" as const }
            : v
        )
      );
      loadLiveTelemetry();
    });

    const unsubDockDwell = eventBus.subscribe("dock_dwell_warning", () => {
      loadLiveTelemetry();
    });

    const unsubDetention = eventBus.subscribe("detention_accruing", () => {
      loadLiveTelemetry();
    });

    const unsubTripDispatched = eventBus.subscribe("trip_dispatched", (event) => {
      const data = event.data as any;
      if (!data) return;
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicle_id || v.code === data.vehicle_code
            ? { ...v, status: "IN_TRANSIT" as const }
            : v
        )
      );
      loadLiveTelemetry();
    });

    const unsubOrderUpdated = eventBus.subscribe("order_updated", () => {
      loadLiveTelemetry();
    });

    const unsubIncidentCreated = eventBus.subscribe("incident_created", () => {
      loadLiveTelemetry();
    });

    const unsubIncidentUpdated = eventBus.subscribe("incident_updated", () => {
      loadLiveTelemetry();
    });

    const unsubDecisionApplied = eventBus.subscribe("decision_applied", () => {
      loadLiveTelemetry();
    });

    // Optional lightweight heartbeat poll every 15s to keep overview metrics razor-sharp
    const interval = setInterval(() => {
      dataProvider.getVehicles().then((v) => {
        if (v && v.length > 0) setVehicles(v);
      }).catch(() => {});
    }, 15000);

    return () => {
      unsubscribePulse();
      unsubTelemetry();
      unsubDockArrival();
      unsubDockDwell();
      unsubDetention();
      unsubTripDispatched();
      unsubOrderUpdated();
      unsubIncidentCreated();
      unsubIncidentUpdated();
      unsubDecisionApplied();
      clearInterval(interval);
    };
  }, [loadLiveTelemetry]);

  const isZeroState = vehicles.length === 0 && warehouses.length === 0 && incidents.length === 0;

  // Convert real assets into MapLibre GIS markers
  const mapWarehouses: MapWarehouse[] = React.useMemo(() => {
    return warehouses.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      city: w.city,
      lat: w.lat,
      lng: w.lng,
      capacityUnits: w.capacityUnits,
      currentUnits: w.currentUnits,
    }));
  }, [warehouses]);

  const mapVehicles: MapVehicle[] = React.useMemo(() => {
    return vehicles.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      lat: v.lat,
      lng: v.lng,
      speedKmh: v.speedKmh,
      heading: v.heading,
      status: v.status,
    }));
  }, [vehicles]);

  const mapIncidents: MapIncident[] = React.useMemo(() => incidents.flatMap((i) => {
    const wh = warehouses.find((w) => w.id === i.affectedEntityId || w.code === i.affectedEntityId);
    const vehicle = vehicles.find((v) => v.id === i.affectedEntityId || v.code === i.affectedEntityId);
    const asset = wh || vehicle;
    if (!asset || !Number.isFinite(asset.lat) || !Number.isFinite(asset.lng)) return [];
    return [{ id: i.id, code: i.code, title: i.title, severity: i.severity, lat: asset.lat, lng: asset.lng }];
  }), [incidents, warehouses, vehicles]);

  const centerLocation: ResolvedLocation | null = React.useMemo(() => {
    if (warehouses.length > 0) {
      return {
        id: warehouses[0].id,
        display_name: `${warehouses[0].name}, ${warehouses[0].city}`,
        latitude: warehouses[0].lat,
        longitude: warehouses[0].lng,
        type: "city",
        confidence: 1.0,
        provider: "nexus-hub",
      };
    }
    return null;
  }, [warehouses]);

  const handleMapClick = (loc: ResolvedLocation) => {
    setClickedMapPoint({ lat: loc.latitude, lng: loc.longitude });
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        {/* Top Header & Overview Actions */}
        <PageHeader
          eyebrow="Workspace Overview · Active Operations"
          title="Overview"
          description="Identify operational items requiring immediate attention, review recent activity, and track active dispatch status."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-200/50 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-300/40 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                {canEditOperations && <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    tactileAudio.playClick();
                    setIsWarehouseModalOpen(true);
                  }}
                  className="font-mono text-xs h-7.5 px-3 rounded-xl shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  + Hub
                </Button>}
                {canEditOperations && <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    tactileAudio.playClick();
                    setIsVehicleModalOpen(true);
                  }}
                  className="font-mono text-xs h-7.5 px-3 rounded-xl"
                >
                  <Truck className="w-3.5 h-3.5 mr-1 text-nexus-secondary" />
                  + Vehicle
                </Button>}
                {canEditOperations && <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    tactileAudio.playClick();
                    setIsOrderModalOpen(true);
                  }}
                  className="font-mono text-xs h-7.5 px-3 rounded-xl"
                >
                  <Package className="w-3.5 h-3.5 mr-1 text-nexus-primary" />
                  + Order
                </Button>}
                {canEditOperations && <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    tactileAudio.playClick();
                    setIsIncidentModalOpen(true);
                  }}
                  className="font-mono text-xs h-7.5 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  + Exception
                </Button>}
              </div>

            </div>
          }
        />

        {loadError && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 text-sm">Couldn’t load workspace data: {loadError} <Button variant="outline" size="sm" onClick={loadLiveTelemetry} className="ml-3">Retry</Button></div>}

        {/* First-use setup for an empty workspace */}
        {isZeroState && (
          <div className="p-6 rounded-2xl border border-nexus-secondary/30 bg-gradient-to-r from-nexus-secondary/10 via-nexus-surface-container/80 to-purple-500/10 shadow-tactile flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-nexus-secondary text-white uppercase">
                  No operational records yet
                </span>
                <span className="text-xs font-mono text-nexus-on-surface-variant">
                  No demo data is loaded
                </span>
              </div>
              <p className="text-xs text-nexus-on-surface leading-relaxed max-w-2xl">
                Add your first warehouse or vehicle, or import your own operational records. Metrics and map markers appear when workspace data is available.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsWarehouseModalOpen(true)}
                className="font-mono text-xs gap-1.5 shadow-tactile"
              >
                <Building2 className="h-3.5 w-3.5" /> + Add First Hub
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVehicleModalOpen(true)}
                className="font-mono text-xs gap-1.5"
              >
                <Truck className="h-3.5 w-3.5" /> + Enroll Vehicle
              </Button>
            </div>
          </div>
        )}

        {/* Workspace operations summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <RoleCockpitSwitcher
              activeRole={activeRole}
              onRoleChange={(role) => {
                tactileAudio.playClick();
                setActiveRole(role);
              }}
            />
          </div>

          {isLoading ? (
            <motion.div
              key="overview-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SkeletonMetricTile />
                <SkeletonMetricTile />
                <SkeletonMetricTile />
                <SkeletonMetricTile />
              </div>
              <SkeletonCard />
            </motion.div>
          ) : (
            <motion.div
              key={`workspace-${activeRole}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeRole === "OPERATIONS_MANAGER" && (
                <ManagerDashboard
                  incidents={incidents}
                  simulations={simulations}
                  warehouses={warehouses}
                  onOpenCreateIncident={canEditOperations ? () => setIsIncidentModalOpen(true) : undefined}
                  onOpenCreateWarehouse={canEditOperations ? () => setIsWarehouseModalOpen(true) : undefined}
                  canRunSimulations={canRunSimulations}
                />
              )}
              {activeRole === "OPERATOR" && (
                <OperatorDashboard
                  vehicles={vehicles}
                  warehouses={warehouses}
                  onOpenCreateVehicle={canEditOperations ? () => setIsVehicleModalOpen(true) : undefined}
                  onOpenCreateOrder={canEditOperations ? () => setIsOrderModalOpen(true) : undefined}
                />
              )}
              {activeRole === "ANALYST" && <AnalystDashboard />}
              {activeRole === "ADMINISTRATOR" && <AdminDashboard />}
              {activeRole === "VIEWER" && <ViewerDashboard />}
            </motion.div>
          )}
        </div>

        {/* 2D Google Maps-Style GIS Network Map & Spatial Timeline Section */}
        <div className="space-y-4 pt-2">
          <div className="rounded-3xl border border-nexus-outline/30 overflow-hidden shadow-tactile bg-nexus-surface-container relative">
            {/* Quick Map Action Badge */}
            {clickedMapPoint && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 p-2 rounded-xl bg-nexus-surface/95 backdrop-blur-md border border-nexus-outline/40 shadow-tactile text-xs font-mono">
                <span>Selected: {clickedMapPoint.lat.toFixed(4)}°, {clickedMapPoint.lng.toFixed(4)}°</span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsWarehouseModalOpen(true)}
                  className="h-6 px-2 text-[11px] font-mono"
                >
                  + Add Hub Here
                </Button>
              </div>
            )}

            <div className="h-[540px] w-full">
              <LeafletWorldMap
                warehouses={mapWarehouses}
                vehicles={mapVehicles}
                incidents={mapIncidents}
                centerLocation={centerLocation}
                onLocationClick={handleMapClick}
                onEntitySelect={(entity) => {
                  if (entity) {
                    router.push(`/live-world?entityType=${entity.type}&id=${encodeURIComponent(entity.id)}`);
                  }
                }}
                className="w-full h-full"
              />
            </div>
          </div>

        </div>

        {/* Real User Input Modals */}
        <CreateWarehouseModal
          isOpen={isWarehouseModalOpen}
          onClose={() => setIsWarehouseModalOpen(false)}
          defaultCoordinates={clickedMapPoint || (centerLocation ? { lat: centerLocation.latitude, lng: centerLocation.longitude } : undefined)}
          onSuccess={(newWh) => {
            setWarehouses((prev) => [newWh, ...prev.filter((w) => w.id !== newWh.id)]);
          }}
        />

        <CreateVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          warehouses={warehouses}
          onSuccess={(newV) => {
            setVehicles((prev) => [newV, ...prev.filter((v) => v.id !== newV.id)]);
          }}
        />

        <CreateOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          warehouses={warehouses}
          vehicles={vehicles}
          onSuccess={() => { loadLiveTelemetry(); }}
        />

        <CreateIncidentModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          vehicles={vehicles}
          warehouses={warehouses}
          onSuccess={(newInc) => {
            setIncidents((prev) => [newInc, ...prev.filter((i) => i.id !== newInc.id)]);
          }}
        />
      </FadeIn>
    </AppShell>
  );
}
