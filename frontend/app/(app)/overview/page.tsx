"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { NexusWorld } from "@/components/world/NexusWorld";
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
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  OperationalEventItem,
  RouteItem,
  SimulationItem,
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
import { InteractiveWorldMap } from "@/components/world/InteractiveWorldMap";
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

export default function OverviewPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);
  const [simulations, setSimulations] = React.useState<SimulationItem[]>([]);
  const [events, setEvents] = React.useState<OperationalEventItem[]>([]);
  
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [worldView, setWorldView] = React.useState<"3D" | "GIS">("3D");
  
  const [operationalMode, setOperationalMode] = React.useState<"PRODUCTION" | "SANDBOX">("SANDBOX");
  const [activeRole, setActiveRole] = React.useState<RoleType>("OPERATIONS_MANAGER");
  const [timelineOffset, setTimelineOffset] = React.useState<number>(0);
  const [showGuideBanner, setShowGuideBanner] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("nexus_operational_mode") as any;
      if (savedMode) setOperationalMode(savedMode);
      const savedRole = localStorage.getItem("nexus_user_role") as RoleType;
      if (savedRole) setActiveRole(savedRole);
    }
  }, []);

  // Fetch live state directly from authoritative dataProvider
  React.useEffect(() => {
    async function loadLiveTelemetry() {
      setIsLoading(true);
      try {
        const [vData, wData, iData, rData, sData] = await Promise.all([
          dataProvider.getVehicles(),
          dataProvider.getWarehouses(),
          dataProvider.getIncidents(),
          dataProvider.getRoutes(),
          dataProvider.getSimulations(),
        ]);

        setVehicles(vData || []);
        setWarehouses(wData || []);
        setIncidents(iData || []);
        setRoutes(rData || []);
        setSimulations(sData || []);
      } catch (err) {
        console.warn("[Overview] Using cached operational state:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveTelemetry();
  }, []);

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

  const handleToggleSandbox = (mode: "PRODUCTION" | "SANDBOX") => {
    setOperationalMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_operational_mode", mode);
    }
    tactileAudio.playSuccess();
    toast({
      title: mode === "PRODUCTION" ? "Production Zero-State Mode" : "Interactive Scenario Sandbox",
      message: mode === "PRODUCTION" ? "Displaying clean production workspace records." : "Loaded 30 Class-8 EV trucks on I-80 Blizzard corridor.",
      type: "info",
    });
  };

  const isZeroState = operationalMode === "PRODUCTION" && vehicles.length === 0 && incidents.length === 0;

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        {/* Top Header & War Room Presence */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <span>Autonomous Digital Twin</span>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <PulseLED color="emerald" size="sm" />
                Sub-Second Telemetry Ingest Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Command & Intelligence Nerve Center
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
                  No sample data injected
                </span>
              </div>
              <p className="text-xs text-nexus-on-surface leading-relaxed max-w-2xl">
                Your workspace is in pristine zero-state with zero fake assets. Import your real fleet CSV or switch to Sandbox mode to explore What-If simulations.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/welcome">
                <Button variant="outline" size="sm" className="font-mono text-xs gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> CSV Fleet Importer
                </Button>
              </Link>
              <Button
                variant="simulation"
                size="sm"
                onClick={() => handleToggleSandbox("SANDBOX")}
                className="font-mono text-xs shadow-tactile"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Load Sandbox Demo
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
              />
            )}
            {activeRole === "OPERATOR" && (
              <OperatorDashboard vehicles={vehicles} warehouses={warehouses} />
            )}
            {activeRole === "ANALYST" && <AnalystDashboard />}
            {activeRole === "ADMINISTRATOR" && <AdminDashboard />}
            {activeRole === "VIEWER" && <ViewerDashboard />}
          </motion.div>
        </AnimatePresence>

        {/* Spatial Digital Twin & 4D Timeline Scrubber Section */}
        <div className="space-y-4 pt-2">
          {/* Spatial World View */}
          <div className="rounded-3xl border border-nexus-outline/30 overflow-hidden shadow-tactile bg-nexus-surface-container relative">
            {/* Map View Toggle Bar */}
            <div className="absolute top-4 right-4 z-20 flex items-center p-1 rounded-xl bg-nexus-surface-container/90 backdrop-blur-md border border-nexus-outline/40 shadow-tactile text-xs font-mono">
              <button
                onClick={() => {
                  setWorldView("3D");
                  tactileAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  worldView === "3D"
                    ? "bg-nexus-secondary text-white font-bold shadow-xs"
                    : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                }`}
              >
                <Box className="w-3.5 h-3.5" /> 3D Digital Twin
              </button>
              <button
                onClick={() => {
                  setWorldView("GIS");
                  tactileAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  worldView === "GIS"
                    ? "bg-nexus-secondary text-white font-bold shadow-xs"
                    : "text-nexus-on-surface-variant hover:text-nexus-on-surface"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> 2D GIS Network
              </button>
            </div>

            <div className="h-[480px] w-full">
              {worldView === "3D" ? (
                <NexusWorld
                  warehouses={warehouses}
                  vehicles={vehicles}
                  routes={routes}
                  incidents={incidents}
                />
              ) : (
                <InteractiveWorldMap
                  warehouses={warehouses}
                  vehicles={vehicles}
                  routes={routes}
                  incidents={incidents}
                />
              )}
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
      </FadeIn>
    </AppShell>
  );
}
