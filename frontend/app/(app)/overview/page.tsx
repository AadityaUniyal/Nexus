"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LeafletWorldMap, MapWarehouse, MapVehicle, MapIncident } from "@/components/map/LeafletWorldMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Truck,
  Building2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  Globe2,
  Upload,
  Radio,
  SlidersHorizontal,
  Map as MapIcon,
  Box,
  PlusCircle,
  Package,
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  OperationalEventItem,
  RouteItem,
  SimulationItem,
  OrderItem,
} from "@/lib/mock-data";
import { formatRelativeTime, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { tactileAudio } from "@/lib/sound-effects";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  PulseLED,
  TactileCard,
} from "@/components/ui/motion-animations";
import { motion, AnimatePresence } from "motion/react";
import { dataProvider } from "@/lib/data-provider";

// Innovations & Role Cockpits
import { RoleCockpitSwitcher, RoleType } from "@/components/role-dashboards/RoleCockpitSwitcher";
import { ManagerDashboard } from "@/components/role-dashboards/ManagerDashboard";
import { OperatorDashboard } from "@/components/role-dashboards/OperatorDashboard";
import { AnalystDashboard } from "@/components/role-dashboards/AnalystDashboard";
import { AdminDashboard } from "@/components/role-dashboards/AdminDashboard";
import { ViewerDashboard } from "@/components/role-dashboards/ViewerDashboard";
import { TimeTravelScrubber } from "@/components/innovations/TimeTravelScrubber";
import { MultiplayerPresence } from "@/components/innovations/MultiplayerPresence";
import { GeofenceHazardPainter } from "@/components/innovations/GeofenceHazardPainter";

// Real Role-Driven Input Modals
import { CreateWarehouseModal } from "@/components/forms/CreateWarehouseModal";
import { CreateVehicleModal } from "@/components/forms/CreateVehicleModal";
import { CreateOrderModal } from "@/components/forms/CreateOrderModal";
import { CreateIncidentModal } from "@/components/forms/CreateIncidentModal";
import { ResolvedLocation } from "@/lib/api/endpoints/location";

export default function OverviewPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);
  const [simulations, setSimulations] = React.useState<SimulationItem[]>([]);
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [worldView, setWorldView] = React.useState<"GIS" | "3D">("GIS");
  
  const [operationalMode, setOperationalMode] = React.useState<"PRODUCTION" | "SANDBOX">("SANDBOX");
  const [activeRole, setActiveRole] = React.useState<RoleType>("OPERATIONS_MANAGER");
  const [timelineOffset, setTimelineOffset] = React.useState<number>(0);

  // Modals state
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = React.useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);
  const [clickedMapPoint, setClickedMapPoint] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("nexus_operational_mode") as any;
      if (savedMode) setOperationalMode(savedMode);
      const savedRole = localStorage.getItem("nexus_user_role") as RoleType;
      if (savedRole) setActiveRole(savedRole);
    }
  }, []);

  // Fetch live state directly from authoritative dataProvider
  const loadLiveTelemetry = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [vData, wData, iData, rData, sData, oData] = await Promise.all([
        dataProvider.getVehicles(),
        dataProvider.getWarehouses(),
        dataProvider.getIncidents(),
        dataProvider.getRoutes(),
        dataProvider.getSimulations(),
        dataProvider.getOrders(),
      ]);

      setVehicles(vData || []);
      setWarehouses(wData || []);
      setIncidents(iData || []);
      setRoutes(rData || []);
      setSimulations(sData || []);
      setOrders(oData || []);
    } catch (err) {
      console.warn("[Overview] Using cached operational state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLiveTelemetry();
  }, [loadLiveTelemetry]);

  const handleRoleChange = (role: RoleType) => {
    setActiveRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_user_role", role);
    }
    toast({
      title: `Switched to ${role.replace("_", " ")} Cockpit`,
      message: "Interface data density, actions, and priority widgets updated.",
      type: "info",
    });
  };

  const handleApplyDecision = async (simId: string) => {
    await dataProvider.applyDecision(simId);
    const updatedSims = await dataProvider.getSimulations();
    setSimulations(updatedSims);
  };

  const handleToggleSandbox = async (mode: "PRODUCTION" | "SANDBOX") => {
    setOperationalMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_operational_mode", mode);
    }
    tactileAudio.playSuccess();
    if (mode === "SANDBOX") {
      // Provision sample preset so sandbox has rich interactive corridor
      await dataProvider.provisionPreset("dehradun");
      await loadLiveTelemetry();
      toast({
        title: "Sandbox Corridor Loaded",
        message: "Loaded Regional Intermodal Corridors & EV fleet for exploration.",
        type: "info",
      });
    } else {
      toast({
        title: "Production Mode Active",
        message: "Operating strictly with genuine user-entered operational assets.",
        type: "info",
      });
    }
  };

  const isZeroState = operationalMode === "PRODUCTION" && vehicles.length === 0 && warehouses.length === 0 && incidents.length === 0;

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

  const mapIncidents: MapIncident[] = React.useMemo(() => {
    return incidents.map((i) => {
      const affectedWh = warehouses.find((w) => w.id === i.affectedEntityId || w.code === i.affectedEntityId);
      const affectedVeh = vehicles.find((v) => v.id === i.affectedEntityId || v.code === i.affectedEntityId);
      const lat = affectedWh?.lat || affectedVeh?.lat || (warehouses[0]?.lat ? warehouses[0].lat + 0.03 : 30.3165);
      const lng = affectedWh?.lng || affectedVeh?.lng || (warehouses[0]?.lng ? warehouses[0].lng + 0.03 : 78.0322);
      return {
        id: i.id,
        code: i.code,
        title: i.title,
        severity: i.severity,
        lat,
        lng,
      };
    });
  }, [incidents, warehouses, vehicles]);

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
        {/* Top Header & War Room Presence */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <span>Operational GIS Nerve Center</span>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <PulseLED color="emerald" size="sm" />
                Sub-Second Telemetry Ingest Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Command & Intelligence Center
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Action Modals Toolbar */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-nexus-surface-container-high border border-nexus-outline/30">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  tactileAudio.playClick();
                  setIsWarehouseModalOpen(true);
                }}
                className="font-mono text-xs h-7.5 px-2.5 shadow-tactile"
              >
                <Building2 className="w-3.5 h-3.5 mr-1" />
                + Add Hub
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  tactileAudio.playClick();
                  setIsVehicleModalOpen(true);
                }}
                className="font-mono text-xs h-7.5 px-2.5"
              >
                <Truck className="w-3.5 h-3.5 mr-1 text-nexus-secondary" />
                + Enroll Vehicle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  tactileAudio.playClick();
                  setIsOrderModalOpen(true);
                }}
                className="font-mono text-xs h-7.5 px-2.5"
              >
                <Package className="w-3.5 h-3.5 mr-1 text-nexus-primary" />
                + New Order
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  tactileAudio.playClick();
                  setIsIncidentModalOpen(true);
                }}
                className="font-mono text-xs h-7.5 px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                + Incident
              </Button>
            </div>

            {/* Live War Room Presence */}
            <MultiplayerPresence />

            {/* Sandbox / Production Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-nexus-surface-container-high border border-nexus-outline/30 text-xs font-mono">
              <button
                onClick={() => handleToggleSandbox("PRODUCTION")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  operationalMode === "PRODUCTION"
                    ? "bg-nexus-surface border border-nexus-outline/40 font-bold text-nexus-on-surface shadow-xs"
                    : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                }`}
              >
                Production (0-State)
              </button>
              <button
                onClick={() => handleToggleSandbox("SANDBOX")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  operationalMode === "SANDBOX"
                    ? "bg-nexus-secondary text-white font-bold shadow-xs"
                    : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                }`}
              >
                Sandbox Demo
              </button>
            </div>
          </div>
        </div>

        {/* Apple Segmented Role Cockpit Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <RoleCockpitSwitcher activeRole={activeRole} onRoleChange={handleRoleChange} />
        </div>

        {/* Zero-State Guide Banner if in Production with 0 records */}
        {isZeroState && (
          <div className="p-6 rounded-2xl border border-nexus-secondary/30 bg-gradient-to-r from-nexus-secondary/10 via-nexus-surface-container/80 to-purple-500/10 shadow-tactile flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-nexus-secondary text-white uppercase">
                  Clean Zero-State Initialized
                </span>
                <span className="text-xs font-mono text-nexus-on-surface-variant">
                  Zero mock data injected
                </span>
              </div>
              <p className="text-xs text-nexus-on-surface leading-relaxed max-w-2xl">
                Your workspace is operating in pristine zero-state. Establish your primary distribution hub, register commercial fleet vehicles, or dispatch orders to populate your Google Maps network.
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
              <Button
                variant="simulation"
                size="sm"
                onClick={() => handleToggleSandbox("SANDBOX")}
                className="font-mono text-xs shadow-tactile"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Load Regional Preset
              </Button>
            </div>
          </div>
        )}

        {/* Bespoke Active Role Dashboard Cockpit */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
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
                onApplyDecision={handleApplyDecision}
                onOpenCreateIncident={() => setIsIncidentModalOpen(true)}
                onOpenCreateWarehouse={() => setIsWarehouseModalOpen(true)}
              />
            )}
            {activeRole === "OPERATOR" && (
              <OperatorDashboard
                vehicles={vehicles}
                warehouses={warehouses}
                onOpenCreateVehicle={() => setIsVehicleModalOpen(true)}
                onOpenCreateOrder={() => setIsOrderModalOpen(true)}
              />
            )}
            {activeRole === "ANALYST" && <AnalystDashboard />}
            {activeRole === "ADMINISTRATOR" && <AdminDashboard />}
            {activeRole === "VIEWER" && <ViewerDashboard />}
          </motion.div>
        </AnimatePresence>

        {/* 2D Google Maps-Style GIS Network Map & Spatial Timeline Section */}
        <div className="space-y-4 pt-2">
          <div className="rounded-3xl border border-nexus-outline/30 overflow-hidden shadow-tactile bg-nexus-surface-container relative">
            {/* Live GPS Telemetry Network HUD */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800 shadow-xl text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
            </div>

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
                className="w-full h-full"
              />
            </div>
          </div>

          {/* 4D Time-Travel Scrubber & Spatial Geofence Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <TimeTravelScrubber onTimeChange={(offset) => setTimelineOffset(offset)} />
            </div>
            <div className="lg:col-span-4">
              <GeofenceHazardPainter />
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
          onSuccess={(newOrd) => {
            setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newOrd.id)]);
          }}
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
