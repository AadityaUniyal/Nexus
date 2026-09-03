"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NexusWorld } from "@/components/world/NexusWorld";
import { NexusMap } from "@/components/map/NexusMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { ResolvedLocation } from "@/lib/api/endpoints/location";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Truck,
  Building2,
  AlertTriangle,
  Map as MapIcon,
  Box,
  Compass,
  MapPin,
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  RouteItem,
} from "@/lib/mock-data";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FadeIn, PulseLED } from "@/components/ui/motion-animations";
import { motion, AnimatePresence } from "motion/react";

export default function LiveWorldPage() {
  const [viewMode, setViewMode] = React.useState<"GIS_MAP" | "WEBGL_3D">("GIS_MAP");
  const [simulationMode, setSimulationMode] = React.useState(false);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);

  const [selectedLocation, setSelectedLocation] = React.useState<ResolvedLocation | null>(null);

  // Load custom location and live backend telemetry on mount
  React.useEffect(() => {
    try {
      const savedLoc = localStorage.getItem("nexus_workspace_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        setSelectedLocation({
          id: `loc-saved-${Date.now()}`,
          display_name: parsed.name || "Operational Superhub",
          latitude: parsed.lat || 41.8781,
          longitude: parsed.lng || -87.6298,
          type: "city",
          confidence: 1.0,
          provider: "geoapify",
        });
      } else {
        setSelectedLocation({
          id: "loc-chi-default",
          display_name: "Chicago Central Hub, IL, United States",
          latitude: 41.8781,
          longitude: -87.6298,
          type: "city",
          confidence: 1.0,
          provider: "geoapify",
        });
      }
    } catch {
      // Fallback
    }

    async function fetchLiveWorldData() {
      try {
        const [vRes, wRes, iRes] = await Promise.all([
          fetch("/api/v1/operations/vehicles").catch(() => null),
          fetch("/api/v1/operations/warehouses").catch(() => null),
          fetch("/api/v1/incidents").catch(() => null),
        ]);

        if (vRes && vRes.ok) {
          const vRaw = await vRes.json();
          const vData = Array.isArray(vRaw) ? vRaw : (vRaw?.data && Array.isArray(vRaw.data)) ? vRaw.data : [];
          if (vData.length > 0) {
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
          const wRaw = await wRes.json();
          const wData = Array.isArray(wRaw) ? wRaw : (wRaw?.data && Array.isArray(wRaw.data)) ? wRaw.data : [];
          if (wData.length > 0) {
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
          const iRaw = await iRes.json();
          const iData = Array.isArray(iRaw) ? iRaw : (iRaw?.data && Array.isArray(iRaw.data)) ? iRaw.data : [];
          if (iData.length > 0) {
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
        // Fallback
      }
    }

    fetchLiveWorldData();
  }, []);

  const [selectedEntity, setSelectedEntity] = React.useState<{
    type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT";
    id: string;
  } | null>(null);

  const selectedVehicle =
    selectedEntity?.type === "VEHICLE"
      ? vehicles.find((v) => v.id === selectedEntity.id)
      : null;

  const selectedWarehouse =
    selectedEntity?.type === "WAREHOUSE"
      ? warehouses.find((w) => w.id === selectedEntity.id)
      : null;

  const selectedIncident =
    selectedEntity?.type === "INCIDENT"
      ? incidents.find((i) => i.id === selectedEntity.id)
      : null;

  // Convert dynamic entities for NexusMap
  const mapVehicles = vehicles.map((v) => ({
    id: v.id,
    code: v.code,
    name: v.name,
    lat: v.lat || 41.14,
    lng: v.lng || -104.82,
    speedKmh: v.speedKmh,
    heading: v.heading || 90,
    status: v.status,
  }));

  const mapWarehouses = warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    city: w.city,
    lat: w.lat,
    lng: w.lng,
    capacityUnits: w.capacityUnits,
    currentUnits: w.currentUnits,
  }));

  const mapIncidents = incidents.map((inc) => ({
    id: inc.id,
    code: inc.code,
    title: inc.title,
    severity: inc.severity,
    lat: 41.2565,
    lng: -95.9345,
  }));

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        {/* Header with Dual Mode Toggle & Location Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <PulseLED color="emerald" size="sm" />
              <span>Spatial Telemetry Viewport</span>
              <span>·</span>
              <span>{viewMode === "GIS_MAP" ? "MapLibre Vector GIS Engine" : "WebGL 3D Digital Twin"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Live Operations World
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl flex items-center gap-1 border border-stone-300/40 dark:border-stone-700">
              <button
                onClick={() => setViewMode("GIS_MAP")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "GIS_MAP"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                <MapIcon className="w-3.5 h-3.5" />
                GIS World Map
              </button>
              <button
                onClick={() => setViewMode("WEBGL_3D")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "WEBGL_3D"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                <Box className="w-3.5 h-3.5" />
                3D Digital Twin
              </button>
            </div>

            <Button
              variant={simulationMode ? "simulation" : "secondary"}
              size="sm"
              onClick={() => setSimulationMode(!simulationMode)}
              className="font-mono-data text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {simulationMode ? "Exit Simulation" : "Simulation Layer"}
            </Button>
          </div>
        </div>

        {/* Natural Location Search Bar */}
        <div className="max-w-xl">
          <LocationSearch
            placeholder="Search operational area (e.g. Dehradun, Tokyo, Chicago, Paris)..."
            onLocationSelected={(loc) => {
              setSelectedLocation(loc);
            }}
          />
        </div>

        {/* World Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {viewMode === "GIS_MAP" ? (
                <motion.div
                  key="gis-map"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-[620px] rounded-xl overflow-hidden shadow-sm"
                >
                  <NexusMap
                    centerLocation={selectedLocation}
                    vehicles={mapVehicles}
                    warehouses={mapWarehouses}
                    incidents={mapIncidents}
                    isSimulationMode={simulationMode}
                    className="h-full"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="webgl-3d"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="h-[620px] rounded-xl overflow-hidden shadow-sm"
                >
                  <NexusWorld
                    warehouses={warehouses}
                    vehicles={vehicles}
                    routes={routes}
                    incidents={incidents}
                    simulationMode={simulationMode}
                    onSelectEntity={(ent) => setSelectedEntity(ent)}
                    className="h-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Telemetry Inspection Panel */}
          <div className="space-y-4">
            <Card className="h-full flex flex-col justify-between shadow-sm border-stone-200/80 dark:border-stone-800">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">Spatial Inspector</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {selectedEntity ? selectedEntity.type : selectedLocation ? "LOCATION" : "STANDBY"}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                    {selectedEntity
                      ? `IDENTIFIER: ${selectedEntity.id}`
                      : selectedLocation
                      ? `ACTIVE BASE: ${selectedLocation.display_name}`
                      : "CLICK ANY NODE TO INSPECT"}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedEntity && selectedLocation && (
                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 space-y-2 text-xs font-mono-data">
                      <div className="flex items-center gap-2 text-nexus-primary font-bold">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{selectedLocation.display_name}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Latitude:</span>
                        <span className="text-nexus-on-surface font-semibold">{selectedLocation.latitude.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Longitude:</span>
                        <span className="text-nexus-on-surface font-semibold">{selectedLocation.longitude.toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Type:</span>
                        <span className="text-nexus-on-surface uppercase">{selectedLocation.type || "City"}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Provider:</span>
                        <span className="text-nexus-on-surface uppercase">{selectedLocation.provider || "Geoapify"}</span>
                      </div>
                    </div>
                  )}

                  {!selectedEntity && !selectedLocation && (
                    <div className="py-12 text-center text-xs text-nexus-on-surface-variant space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                        <Compass className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-nexus-on-surface">No Entity Selected</p>
                      <p className="leading-relaxed">
                        Click any vehicle hauler, warehouse hub, or weather alert marker on the map to stream live operational metrics.
                      </p>
                    </div>
                  )}

                  {selectedVehicle && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 text-xs font-mono-data"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-sm text-nexus-on-surface">{selectedVehicle.name}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Code:</span>
                          <span className="font-semibold">{selectedVehicle.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Velocity:</span>
                          <span className="font-semibold text-emerald-600">{selectedVehicle.speedKmh} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Battery SoC:</span>
                          <span className="font-semibold">{selectedVehicle.batteryPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Driver:</span>
                          <span className="font-semibold">{selectedVehicle.driverName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Status:</span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950">
                            {selectedVehicle.status}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/simulations/new?vehicleId=${selectedVehicle.id}`}>
                        <Button variant="simulation" size="sm" className="w-full mt-2 font-mono-data text-xs">
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          Simulate Reroute
                        </Button>
                      </Link>
                    </motion.div>
                  )}

                  {selectedWarehouse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 text-xs font-mono-data"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-stone-800 dark:text-stone-200" />
                        <span className="font-bold text-sm text-nexus-on-surface">{selectedWarehouse.name}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Code:</span>
                          <span className="font-semibold">{selectedWarehouse.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Inventory Units:</span>
                          <span className="font-semibold">
                            {selectedWarehouse.currentUnits} / {selectedWarehouse.capacityUnits}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Active Docks:</span>
                          <span className="font-semibold">
                            {selectedWarehouse.activeDocks} / {selectedWarehouse.dockCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Efficiency:</span>
                          <span className="font-semibold text-emerald-600">{selectedWarehouse.efficiencyPct}%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedIncident && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        <span className="font-bold text-sm text-nexus-on-surface">{selectedIncident.code}</span>
                      </div>
                      <p className="text-nexus-on-surface leading-relaxed text-xs">{selectedIncident.title}</p>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 font-mono-data space-y-1">
                        <p>Severity: {selectedIncident.severity}</p>
                        <p>Projected Delay: {selectedIncident.delayMinutes} mins</p>
                      </div>
                      <Link href={`/incidents/${selectedIncident.id}`}>
                        <Button variant="danger" size="sm" className="w-full mt-2 font-mono-data text-xs">
                          Inspect Resolution
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 border-t border-nexus-outline-variant/30 text-[11px] font-mono-data text-nexus-on-surface-variant flex items-center justify-between">
                <span>Pan: Click & Drag</span>
                <span>Zoom: Scroll</span>
              </div>
            </Card>
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
