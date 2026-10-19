"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LeafletWorldMap } from "@/components/map/LeafletWorldMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { ResolvedLocation } from "@/lib/api/endpoints/location";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  GitBranch,
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
import { apiFetch } from "@/lib/api/http";
import { dataProvider } from "@/lib/data-provider";
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
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Load only records belonging to the signed-in workspace.
  React.useEffect(() => {
    let active = true;
    Promise.all([dataProvider.getVehicles(), dataProvider.getWarehouses(), dataProvider.getIncidents()])
      .then(([vehicleRows, warehouseRows, incidentRows]) => {
        if (!active) return;
        setVehicles(vehicleRows);
        setWarehouses(warehouseRows);
        setIncidents(incidentRows);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Workspace records could not be loaded.");
      });
    return () => { active = false; };
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
  const mapVehicles = vehicles.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng)).map((v) => ({
    id: v.id,
    code: v.code,
    name: v.name,
    lat: v.lat,
    lng: v.lng,
    speedKmh: v.speedKmh,
    heading: v.heading,
    status: v.status,
  }));

  const mapWarehouses = warehouses.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng)).map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    city: w.city,
    lat: w.lat,
    lng: w.lng,
    capacityUnits: w.capacityUnits,
    currentUnits: w.currentUnits,
  }));

  const mapIncidents: Array<{ id: string; code: string; title: string; severity: string; lat: number; lng: number }> = [];

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        {/* Header with Dual Mode Toggle & Location Search */}
        <PageHeader
          eyebrow="Workspace operations · Geographic view"
          title="Operations map"
          description="Explore workspace vehicles and facilities with recorded coordinates. Telemetry freshness depends on your connected data source."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={simulationMode ? "simulation" : "secondary"}
                size="sm"
                onClick={() => setSimulationMode(!simulationMode)}
                className="font-mono-data text-xs"
              >
                <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                {simulationMode ? "Exit Scenario View" : "Scenario Overlay"}
              </Button>
            </div>
          }
        />

        {loadError && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{loadError}</div>}

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
            <div className="h-[640px] rounded-2xl overflow-hidden shadow-tactile border border-stone-200/80 dark:border-stone-800">
              <LeafletWorldMap
                centerLocation={selectedLocation}
                vehicles={mapVehicles}
                warehouses={mapWarehouses}
                incidents={mapIncidents}
                isSimulationMode={simulationMode}
                className="h-full"
              />
            </div>
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
                        <span className="font-semibold text-emerald-600">{selectedVehicle.speedKmh == null ? "Not recorded" : `${selectedVehicle.speedKmh} km/h`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Battery SoC:</span>
                          <span className="font-semibold">{selectedVehicle.batteryPct == null ? "Not recorded" : `${selectedVehicle.batteryPct}%`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Driver:</span>
                          <span className="font-semibold">{selectedVehicle.driverName || "Not assigned"}</span>
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
                          <GitBranch className="h-3.5 w-3.5 mr-1" />
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
                            {selectedWarehouse.currentUnits == null || selectedWarehouse.capacityUnits == null ? "Not recorded" : `${selectedWarehouse.currentUnits} / ${selectedWarehouse.capacityUnits}`}
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
