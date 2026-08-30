"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { NexusWorld } from "@/components/world/NexusWorld";
import { MetricTile } from "@/components/ui/metric-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusLed } from "@/components/ui/status-led";
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
} from "lucide-react";
import {
  INITIAL_WAREHOUSES,
  INITIAL_VEHICLES,
  INITIAL_ROUTES,
  INITIAL_INCIDENTS,
  INITIAL_EVENTS,
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  OperationalEventItem,
} from "@/lib/mock-data";
import { formatRelativeTime, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { tactileAudio } from "@/lib/sound-effects";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  PulseLED,
  TactileCard,
} from "@/components/ui/motion-animations";
import { InteractiveWorldMap } from "@/components/world/InteractiveWorldMap";
import { motion, AnimatePresence } from "motion/react";
import { Map as MapIcon, Box } from "lucide-react";

export default function OverviewPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>(INITIAL_WAREHOUSES);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>(INITIAL_VEHICLES);
  const [routes, setRoutes] = React.useState(INITIAL_ROUTES);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [events, setEvents] = React.useState<OperationalEventItem[]>(INITIAL_EVENTS);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [worldView, setWorldView] = React.useState<"3D" | "GIS">("3D");
  const [briefing, setBriefing] = React.useState<string>(
    "Operations situation normal with 2 active anomalies flagged. Vehicle NX-TRK-104 is holding near Cheyenne Summit due to an I-80 corridor blizzard warning. Simulation SIM-SCENARIO-901 indicates an active I-70 detour will recover 135 minutes with 94% confidence. Fleet utilization is at 80% across 6 primary fulfillment superhubs."
  );

  // Fetch live state from backend on mount and setup live event bus listeners
  React.useEffect(() => {
    async function loadLiveTelemetry() {
      try {
        const [vRes, wRes, iRes] = await Promise.all([
          fetch('/api/v1/operations/vehicles').catch(() => null),
          fetch('/api/v1/operations/warehouses').catch(() => null),
          fetch('/api/v1/incidents').catch(() => null),
        ]);

        if (vRes && vRes.ok) {
          const vData = await vRes.json();
          if (Array.isArray(vData) && vData.length > 0) {
            setVehicles(
              vData.map((v: any) => ({
                id: v.id,
                code: v.code,
                name: v.name,
                model: v.model || "Class-8 EV Hauler",
                driverName: v.driver_name || v.driverName || "Fleet Pilot",
                driverPhone: v.driver_phone || v.driverPhone || "+1 (555) 019-2834",
                capacityKg: v.capacity_kg || v.capacityKg || 22000,
                currentLoadKg: v.current_load_kg || v.currentLoadKg || 17800,
                status: (v.status || "IN_TRANSIT") as any,
                lat: v.current_lat || v.lat || 41.1400,
                lng: v.current_lng || v.lng || -104.8202,
                heading: v.heading || 90,
                speedKmh: v.speed_kmh || v.speedKmh || 68.5,
                batteryPct: v.battery_pct || v.batteryPct || 78,
                healthScore: v.health_score || v.healthScore || 94,
                currentRouteId: v.current_route_id || v.currentRouteId || null,
                currentRouteName: v.current_route_name || v.currentRouteName || "Active Corridor",
              }))
            );
          }
        }

        if (wRes && wRes.ok) {
          const wData = await wRes.json();
          if (Array.isArray(wData) && wData.length > 0) {
            setWarehouses(
              wData.map((w: any) => ({
                id: w.id,
                code: w.code,
                name: w.name,
                city: w.city,
                state: w.state,
                lat: w.lat,
                lng: w.lng,
                capacityUnits: w.capacity_units || w.capacityUnits || 15000,
                currentUnits: w.current_units || w.currentUnits || 12000,
                dockCount: w.dock_count || w.dockCount || 12,
                activeDocks: w.active_docks || w.activeDocks || 8,
                efficiencyPct: w.efficiency_pct || w.efficiencyPct || 95.0,
                status: (w.status || "OPERATIONAL") as any,
                createdAt: w.created_at || w.createdAt || new Date().toISOString(),
              }))
            );
          }
        }

        if (iRes && iRes.ok) {
          const iData = await iRes.json();
          if (Array.isArray(iData) && iData.length > 0) {
            setIncidents(
              iData.map((i: any) => ({
                id: i.id,
                code: i.code,
                title: i.title,
                severity: (i.severity || "HIGH") as any,
                status: (i.status || "DETECTED") as any,
                category: i.category || "WEATHER",
                summary: i.summary || i.title,
                affectedEntityType: (i.affected_entity_type || i.affectedEntityType || "VEHICLE") as any,
                affectedEntityId: i.affected_entity_id || i.affectedEntityId || "v-104",
                affectedEntityName: i.affected_entity_name || i.affectedEntityName || "Vehicle NX-TRK-104",
                rootCause: i.root_cause || i.rootCause || "Severe atmospheric blizzard obstacle",
                aiAnalysis: i.ai_analysis || i.aiAnalysis || "Deterministic detour calculation recommended.",
                potentialImpact: i.potential_impact || i.potentialImpact || "SLA breach risk +180 mins",
                costEstimate: i.cost_estimate || i.costEstimate || 2500,
                ordersAffected: i.orders_affected || i.affected_orders_count || 14,
                delayMinutes: i.delay_minutes || i.delayMinutes || 180,
                createdAt: i.created_at || i.createdAt || new Date().toISOString(),
                timeline: i.timeline || [],
              }))
            );
          }
        }
      } catch {
        // Fallback to local deterministic state
      }
    }

    loadLiveTelemetry();

    // Listen to live decision application and voice simulation events
    const handleVoiceAction = (e: any) => {
      const detail = e.detail;
      if (detail?.action_type === 'RUN_SIMULATION') {
        tactileAudio.playSuccessChord();
        setEvents((prev) => [
          {
            id: `ev-${Date.now()}`,
            eventType: 'simulation.computed',
            entityType: 'SIMULATION',
            entityId: detail.action_payload?.vehicle_code || 'NX-104',
            severity: 'INFO',
            message: `Voice Sim Computed: +${detail.action_payload?.time_saved_mins} mins recovered on ${detail.action_payload?.vehicle_code}`,
            occurredAt: new Date().toISOString(),
          },
          ...prev.slice(0, 5),
        ]);
      }
    };

    window.addEventListener('nexus:voice-action', handleVoiceAction);
    return () => window.removeEventListener('nexus:voice-action', handleVoiceAction);
  }, []);

  const activeVehicles = vehicles.filter((v) => v.status === "IN_TRANSIT").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED");

  const handleRefreshBriefing = async () => {
    setIsRefreshing(true);
    tactileAudio.playClick();
    try {
      const res = await fetch("/api/v1/ai/briefing", { method: "POST" });
      const json = await res.json();
      if (json.briefing) {
        setBriefing(json.briefing);
        tactileAudio.playTelemetryPing();
        toast({
          title: "Groq AI Briefing Updated",
          message: "Synthesized latest operational telemetry.",
          type: "ai",
        });
      }
    } catch {
      toast({
        title: "Briefing Refreshed",
        message: "Loaded deterministic operational state.",
        type: "info",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AppShell>
      <FadeIn className="space-y-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Operational Dashboard</span>
              <span>·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <PulseLED color="emerald" size="sm" />
                Live Telemetry Ingestion Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Command & Intelligence Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshBriefing}
              isLoading={isRefreshing}
              className="font-mono-data text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh Synthesis
            </Button>

            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono-data text-xs shadow-tactile">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                New Simulation
              </Button>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics Row with Stagger Animation */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <TactileCard>
              <MetricTile
                title="Fleet In-Transit"
                value={`${activeVehicles} / ${vehicles.length}`}
                subtitle="80% Active Fleet Utilization"
                change="+4.2%"
                trend="up"
                status="HEALTHY"
                icon={Truck}
              />
            </TactileCard>
          </StaggerItem>
          <StaggerItem>
            <TactileCard>
              <MetricTile
                title="Network SLA Adherence"
                value="96.8%"
                subtitle="1 Order Projected Delayed"
                change="-1.2%"
                trend="down"
                status="HEALTHY"
                icon={Activity}
              />
            </TactileCard>
          </StaggerItem>
          <StaggerItem>
            <TactileCard>
              <MetricTile
                title="Hub Storage Capacity"
                value="72,450"
                subtitle="81% Aggregate Dock Load"
                change="+2.8%"
                trend="up"
                status="ATTENTION"
                icon={Building2}
              />
            </TactileCard>
          </StaggerItem>
          <StaggerItem>
            <TactileCard>
              <MetricTile
                title="Active Incidents"
                value={criticalIncidents.length.toString()}
                subtitle="1 Critical Blizzard Reroute Needed"
                status="CRITICAL"
                variant="critical"
                icon={ShieldAlert}
              />
            </TactileCard>
          </StaggerItem>
        </StaggerContainer>

        {/* AI Operational Command Briefing Card */}
        <motion.div whileHover={{ scale: 1.005 }} transition={{ duration: 0.2 }}>
          <Card className="simulation-layer border border-purple-500/30 bg-purple-500/[0.02]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-nexus-on-surface">
                    Groq AI Operational Briefing · LLaMA 3.3 Synthesis
                  </h3>
                  <p className="text-[11px] text-nexus-on-surface-variant font-mono-data">
                    Real-time situation awareness derived from live IoT telemetry and deterministic simulations
                  </p>
                </div>
              </div>
              <Badge variant="simulation" size="sm">
                Live Synthesis
              </Badge>
            </div>

            <p className="mt-3 text-sm text-nexus-on-surface leading-relaxed font-sans">
              {briefing}
            </p>
          </Card>
        </motion.div>

        {/* Critical Incident Banner if any */}
        {criticalIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-mono-data">
                    CRITICAL INCIDENT: {criticalIncidents[0].code}
                  </span>
                  <Badge variant="critical" size="sm">
                    Action Pending
                  </Badge>
                </div>
                <p className="text-xs text-nexus-on-surface mt-1">
                  {criticalIncidents[0].title} — {criticalIncidents[0].summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/incidents/${criticalIncidents[0].id}`}>
                <Button variant="secondary" size="sm" className="font-mono-data text-xs">
                  Inspect Incident
                </Button>
              </Link>
              <Link href="/simulations/sim-901">
                <Button variant="simulation" size="sm" className="font-mono-data text-xs">
                  Review Simulation (135 min save)
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Spatial Digital Twin World Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold text-nexus-on-surface tracking-tight">
                Live Spatial Viewport
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Map / 3D */}
              <div className="bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg flex items-center gap-0.5 text-xs">
                <button
                  onClick={() => setWorldView("3D")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1",
                    worldView === "3D" ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500"
                  )}
                >
                  <Box className="w-3 h-3" />
                  3D View
                </button>
                <button
                  onClick={() => setWorldView("GIS")}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1",
                    worldView === "GIS" ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm" : "text-stone-500"
                  )}
                >
                  <MapIcon className="w-3 h-3" />
                  GIS Map
                </button>
              </div>

              <Link
                href="/live-world"
                className="text-xs font-semibold text-nexus-secondary hover:underline font-mono-data flex items-center gap-1 ml-2"
              >
                <span>Full Viewport</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {worldView === "3D" ? (
              <motion.div
                key="view-3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <NexusWorld
                  warehouses={warehouses}
                  vehicles={vehicles}
                  routes={routes}
                  incidents={incidents}
                />
              </motion.div>
            ) : (
              <motion.div
                key="view-gis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <InteractiveWorldMap
                  warehouses={warehouses}
                  vehicles={vehicles}
                  routes={routes}
                  incidents={incidents}
                  className="h-[520px]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Grid: Active Fleet Overview & Recent Telemetry Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Fleet List */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Fleet Telemetry Watch</CardTitle>
                <CardDescription>Real-time vehicle status and assigned routes</CardDescription>
              </div>
              <Link href="/operations" className="text-xs font-semibold text-nexus-secondary font-mono-data hover:underline">
                View All Vehicles
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-nexus-outline-variant/20">
                {vehicles.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-nexus-surface-container text-nexus-on-surface">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-nexus-on-surface">{v.code}</span>
                          <StatusLed
                            status={v.healthScore < 80 ? "CRITICAL" : v.status === "IN_TRANSIT" ? "HEALTHY" : "OFFLINE"}
                            size="sm"
                          />
                        </div>
                        <p className="text-[11px] text-nexus-on-surface-variant font-mono-data truncate max-w-xs">
                          {v.currentRouteName || "Standby at Newark Depot"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono-data">
                      <p className="font-semibold text-nexus-on-surface">{v.speedKmh} km/h</p>
                      <p className="text-[10px] text-nexus-on-surface-variant">Battery: {v.batteryPct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Event Stream */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live Event Stream</CardTitle>
                <CardDescription>Automated IoT and sensor telemetry bus</CardDescription>
              </div>
              <Link href="/intelligence" className="text-xs font-semibold text-nexus-secondary font-mono-data hover:underline">
                Pattern View
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg bg-nexus-surface-container/50 border border-nexus-outline-variant/20 flex items-start gap-3 text-xs"
                  >
                    <div className="mt-0.5">
                      <StatusLed status={ev.severity} size="sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-nexus-on-surface font-medium">{ev.message}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono-data text-nexus-on-surface-variant mt-1">
                        <span>Type: {ev.eventType}</span>
                        <span>{formatRelativeTime(ev.occurredAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </AppShell>
  );
}
