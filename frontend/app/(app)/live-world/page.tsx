"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LeafletWorldMap, SelectedEntityInfo } from "@/components/map/LeafletWorldMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { ResolvedLocation } from "@/lib/api/endpoints/location";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Drawer } from "@/components/ui/drawer";
import {
  GitBranch,
  Truck,
  Building2,
  AlertTriangle,
  Compass,
  MapPin,
  ExternalLink,
  BatteryCharging,
  Gauge,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  IncidentItem,
  RouteItem,
} from "@/lib/mock-data";
import Link from "next/link";
import { dataProvider } from "@/lib/data-provider";
import { FadeIn } from "@/components/ui/motion-animations";
import { motion } from "motion/react";

function LiveWorldContent() {
  const searchParams = useSearchParams();
  const queryEntityType = searchParams ? searchParams.get("entityType") : null;
  const queryId = searchParams ? searchParams.get("id") : null;

  const [simulationMode, setSimulationMode] = React.useState(false);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [incidents, setIncidents] = React.useState<IncidentItem[]>([]);

  const [selectedLocation, setSelectedLocation] = React.useState<ResolvedLocation | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [selectedEntity, setSelectedEntity] = React.useState<{
    type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT";
    id: string;
  } | null>(null);

  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);
  const [flyToTarget, setFlyToTarget] = React.useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Load records belonging to the signed-in workspace.
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

  // Handle URL query parameters for smooth camera flyTo and inspector open
  React.useEffect(() => {
    if (!queryId) return;
    const typeUpper = (queryEntityType || "VEHICLE").toUpperCase();

    if (typeUpper === "VEHICLE" && vehicles.length > 0) {
      const v = vehicles.find((x) => x.id === queryId || x.code === queryId);
      if (v && Number.isFinite(v.lat) && Number.isFinite(v.lng)) {
        setSelectedEntity({ type: "VEHICLE", id: v.id });
        setIsInspectorOpen(true);
        setFlyToTarget({ lat: v.lat, lng: v.lng, zoom: 14 });
      }
    } else if (typeUpper === "WAREHOUSE" && warehouses.length > 0) {
      const w = warehouses.find((x) => x.id === queryId || x.code === queryId);
      if (w && Number.isFinite(w.lat) && Number.isFinite(w.lng)) {
        setSelectedEntity({ type: "WAREHOUSE", id: w.id });
        setIsInspectorOpen(true);
        setFlyToTarget({ lat: w.lat, lng: w.lng, zoom: 14 });
      }
    } else if (typeUpper === "INCIDENT" && incidents.length > 0) {
      const inc = incidents.find((x) => x.id === queryId || x.code === queryId);
      if (inc) {
        setSelectedEntity({ type: "INCIDENT", id: inc.id });
        setIsInspectorOpen(true);
        const lat = (inc as any).lat;
        const lng = (inc as any).lng;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setFlyToTarget({ lat, lng, zoom: 14 });
        }
      }
    }
  }, [queryEntityType, queryId, vehicles, warehouses, incidents]);

  const selectedVehicle =
    selectedEntity?.type === "VEHICLE"
      ? vehicles.find((v) => v.id === selectedEntity.id || v.code === selectedEntity.id)
      : null;

  const selectedWarehouse =
    selectedEntity?.type === "WAREHOUSE"
      ? warehouses.find((w) => w.id === selectedEntity.id || w.code === selectedEntity.id)
      : null;

  const selectedIncident =
    selectedEntity?.type === "INCIDENT"
      ? incidents.find((i) => i.id === selectedEntity.id || i.code === selectedEntity.id)
      : null;

  const handleEntitySelect = (entity: SelectedEntityInfo | null) => {
    if (entity) {
      setSelectedEntity({ type: entity.type, id: entity.id });
      setIsInspectorOpen(true);
      if (Number.isFinite(entity.data?.lat) && Number.isFinite(entity.data?.lng)) {
        setFlyToTarget({ lat: entity.data.lat, lng: entity.data.lng, zoom: 14 });
      }
    } else {
      setSelectedEntity(null);
      setIsInspectorOpen(false);
    }
  };

  // Convert dynamic entities for LeafletWorldMap
  const mapVehicles = vehicles
    .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
    .map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      lat: v.lat,
      lng: v.lng,
      speedKmh: v.speedKmh,
      heading: v.heading,
      status: v.status,
      driverName: v.driverName,
      batteryPct: v.batteryPct,
    }));

  const mapWarehouses = warehouses
    .filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng))
    .map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      city: w.city,
      lat: w.lat,
      lng: w.lng,
      capacityUnits: w.capacityUnits,
      currentUnits: w.currentUnits,
    }));

  const mapIncidents = incidents
    .filter((inc) => Number.isFinite((inc as any).lat) && Number.isFinite((inc as any).lng))
    .map((inc) => ({
      id: inc.id,
      code: inc.code,
      title: inc.title,
      severity: inc.severity,
      lat: (inc as any).lat,
      lng: (inc as any).lng,
    }));

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        {/* Header with Dual Mode Toggle & Location Search */}
        <PageHeader
          eyebrow="Workspace operations · Geographic view"
          title="Operations map"
          description="Live spatial command radar. Click any fleet asset, logistics hub, or anomaly beacon to inspect telemetry and trigger real-time actions."
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

        {loadError && (
          <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            {loadError}
          </div>
        )}

        {/* Natural Location Search Bar */}
        <div className="max-w-xl">
          <LocationSearch
            placeholder="Search operational area (e.g. Dehradun, Tokyo, Chicago, Paris)..."
            onLocationSelected={(loc) => {
              setSelectedLocation(loc);
              if (loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
                setFlyToTarget({ lat: loc.latitude, lng: loc.longitude, zoom: 12 });
              }
            }}
          />
        </div>

        {/* World Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="h-[660px] rounded-2xl overflow-hidden shadow-tactile border border-black/[0.08] dark:border-white/[0.12] bg-nexus-surface-lowest">
              <LeafletWorldMap
                centerLocation={selectedLocation}
                vehicles={mapVehicles}
                warehouses={mapWarehouses}
                incidents={mapIncidents}
                isSimulationMode={simulationMode}
                className="h-full"
                selectedEntity={
                  selectedEntity
                    ? {
                        type: selectedEntity.type as any,
                        id: selectedEntity.id,
                        data: selectedVehicle || selectedWarehouse || selectedIncident || {},
                      }
                    : null
                }
                onEntitySelect={handleEntitySelect}
                flyToLocation={flyToTarget}
              />
            </div>
          </div>

          {/* Side Telemetry Inspection Panel (Synchronized with Map) */}
          <div className="space-y-4">
            <Card className="h-full flex flex-col justify-between shadow-tactile border border-black/[0.08] dark:border-white/[0.12] bg-white/70 dark:bg-[#151518]/70 backdrop-blur-3xl rounded-[24px]">
              <div>
                <CardHeader className="border-b border-black/[0.08] dark:border-white/[0.12] pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold tracking-tight">Spatial Inspector</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono border-black/[0.08] dark:border-white/[0.12]">
                      {selectedEntity ? selectedEntity.type : selectedLocation ? "LOCATION" : "STANDBY"}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono-data text-nexus-on-surface-variant">
                    {selectedEntity
                      ? `IDENTIFIER: ${selectedEntity.id}`
                      : selectedLocation
                      ? `ACTIVE BASE: ${selectedLocation.display_name}`
                      : "CLICK ANY PIN TO INSPECT"}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {!selectedEntity && selectedLocation && (
                    <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2 text-xs font-mono-data">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
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
                    </div>
                  )}

                  {!selectedEntity && !selectedLocation && (
                    <div className="py-12 text-center text-xs text-nexus-on-surface-variant space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center mx-auto text-stone-400">
                        <Compass className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-nexus-on-surface">No Entity Selected</p>
                      <p className="leading-relaxed text-[11px]">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-sm text-nexus-on-surface">{selectedVehicle.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsInspectorOpen(true)}
                          className="h-7 text-xs px-2"
                        >
                          Expand <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Code:</span>
                          <span className="font-semibold">{selectedVehicle.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Velocity:</span>
                          <span className="font-semibold text-emerald-600">
                            {selectedVehicle.speedKmh == null ? "Not recorded" : `${selectedVehicle.speedKmh} km/h`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Battery SoC:</span>
                          <span className="font-semibold">
                            {selectedVehicle.batteryPct == null ? "Not recorded" : `${selectedVehicle.batteryPct}%`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Status:</span>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            {selectedVehicle.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsInspectorOpen(true)}
                        className="w-full text-xs"
                      >
                        Open Inspector Sheet
                      </Button>
                    </motion.div>
                  )}

                  {selectedWarehouse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 text-xs font-mono-data"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-sm text-nexus-on-surface">{selectedWarehouse.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsInspectorOpen(true)}
                          className="h-7 text-xs px-2"
                        >
                          Expand <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Code:</span>
                          <span className="font-semibold">{selectedWarehouse.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">City:</span>
                          <span className="font-semibold">{selectedWarehouse.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Active Docks:</span>
                          <span className="font-semibold">
                            {selectedWarehouse.activeDocks} / {selectedWarehouse.dockCount}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsInspectorOpen(true)}
                        className="w-full text-xs"
                      >
                        Open Inspector Sheet
                      </Button>
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
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 font-mono-data space-y-1">
                        <p>Severity: {selectedIncident.severity}</p>
                        <p>Delay: {selectedIncident.delayMinutes} mins</p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setIsInspectorOpen(true)}
                        className="w-full text-xs"
                      >
                        Inspect Anomaly
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </div>

              <div className="p-4 border-t border-black/[0.08] dark:border-white/[0.12] text-[11px] font-mono-data text-nexus-on-surface-variant flex items-center justify-between">
                <span>Pan: Click & Drag</span>
                <span>Zoom: Scroll</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Synchronized Cupertino Spring Slide-over Inspector Sheet */}
        <Drawer
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          title={
            selectedVehicle
              ? `Commercial Fleet Unit: ${selectedVehicle.name} (${selectedVehicle.code})`
              : selectedWarehouse
              ? `Logistics Hub: ${selectedWarehouse.name} (${selectedWarehouse.code})`
              : selectedIncident
              ? `Operational Anomaly: ${selectedIncident.code}`
              : "Entity Inspector"
          }
          subtitle={
            selectedVehicle
              ? `Status: ${selectedVehicle.status} · Real-Time Telemetry Synchronized`
              : selectedWarehouse
              ? `${selectedWarehouse.city}, ${selectedWarehouse.state || ""} · 500m Dock Geofence Active`
              : selectedIncident
              ? `Severity: ${selectedIncident.severity} · Incident Triage Active`
              : undefined
          }
          width="md"
        >
          {selectedVehicle && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12]">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
                    <Gauge className="h-3.5 w-3.5" />
                    <span>Velocity</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-emerald-600">
                    {selectedVehicle.speedKmh == null ? "0" : selectedVehicle.speedKmh} <span className="text-xs font-normal">km/h</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12]">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
                    <BatteryCharging className="h-3.5 w-3.5" />
                    <span>Battery SoC</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-nexus-on-surface">
                    {selectedVehicle.batteryPct == null ? "—" : `${selectedVehicle.batteryPct}%`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Assigned Driver:</span>
                  <span className="font-semibold text-nexus-on-surface">{selectedVehicle.driverName || "Fleet Operator"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Operational State:</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {selectedVehicle.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">GPS Coordinates:</span>
                  <span className="font-semibold text-nexus-on-surface">
                    {selectedVehicle.lat.toFixed(4)}°, {selectedVehicle.lng.toFixed(4)}°
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Heading:</span>
                  <span className="font-semibold text-nexus-on-surface">{selectedVehicle.heading || 0}°</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Tactical Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link href={`/operations`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Truck className="h-3.5 w-3.5 mr-1.5" /> Operations Console
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFlyToTarget({ lat: selectedVehicle.lat, lng: selectedVehicle.lng, zoom: 15 });
                      setIsInspectorOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5" /> Center Camera
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedWarehouse && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12]">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Active Docks</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-nexus-on-surface">
                    {selectedWarehouse.activeDocks} <span className="text-xs font-normal text-stone-400">/ {selectedWarehouse.dockCount}</span>
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12]">
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Geofence Radius</span>
                  </div>
                  <p className="text-xl font-bold font-mono text-emerald-600">
                    500 <span className="text-xs font-normal">meters</span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Facility Location:</span>
                  <span className="font-semibold text-nexus-on-surface">{selectedWarehouse.city}, {selectedWarehouse.state}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Current Occupancy:</span>
                  <span className="font-semibold text-nexus-on-surface">
                    {selectedWarehouse.currentUnits?.toLocaleString()} / {selectedWarehouse.capacityUnits?.toLocaleString()} Units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Dock Efficiency:</span>
                  <span className="font-semibold text-emerald-600">{selectedWarehouse.efficiencyPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">GPS Coordinates:</span>
                  <span className="font-semibold text-nexus-on-surface">
                    {selectedWarehouse.lat.toFixed(4)}°, {selectedWarehouse.lng.toFixed(4)}°
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Tactical Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link href={`/intelligence`} className="w-full">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Clock className="h-3.5 w-3.5 mr-1.5" /> Detention Radar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFlyToTarget({ lat: selectedWarehouse.lat, lng: selectedWarehouse.lng, zoom: 15 });
                      setIsInspectorOpen(false);
                    }}
                    className="w-full text-xs"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5" /> Center Camera
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedIncident && (
            <div className="space-y-6 text-sm">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Severity: {selectedIncident.severity}</span>
                </div>
                <p className="text-xs leading-relaxed">{selectedIncident.title}</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.12] space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Projected Delay:</span>
                  <span className="font-bold text-rose-600">+{selectedIncident.delayMinutes} mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Anomaly Category:</span>
                  <span className="font-semibold text-nexus-on-surface">{(selectedIncident as any).category || selectedIncident.affectedEntityType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Current Status:</span>
                  <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                    {selectedIncident.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Resolution Pipeline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Link href={`/incidents/${selectedIncident.id}`} className="w-full">
                    <Button variant="danger" size="sm" className="w-full text-xs">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Triage Queue
                    </Button>
                  </Link>
                  <Link href={`/analytics`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <GitBranch className="h-3.5 w-3.5 mr-1.5" /> What-If Simulator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </FadeIn>
    </AppShell>
  );
}

export default function LiveWorldPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs font-mono text-stone-400">Loading spatial radar...</div>}>
      <LiveWorldContent />
    </React.Suspense>
  );
}
