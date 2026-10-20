"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Building2,
  Route as RouteIcon,
  Package,
  Search,
  Sparkles,
  SlidersHorizontal,
  ArrowUpRight,
  Plus,
  Upload,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  RouteItem,
  OrderItem,
} from "@/lib/mock-data";
import { dataProvider } from "@/lib/data-provider";
import { eventBus } from "@/lib/event-bus";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = React.useState("vehicles");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Modal States
  const [isAddHubOpen, setIsAddHubOpen] = React.useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  // Form states for new Hub
  const [hubForm, setHubForm] = React.useState({
    code: "", name: "", city: "", state: "", lat: "", lng: "",
    capacityUnits: "", currentUnits: "", dockCount: "", activeDocks: "", efficiencyPct: "",
  });

  // Form states for new Vehicle
  const [vehicleForm, setVehicleForm] = React.useState({
    code: "", name: "", model: "", driverName: "", lat: "", lng: "",
    speedKmh: "", batteryPct: "", healthScore: "", status: "IDLE",
  });

  const loadData = React.useCallback(async () => {
    try {
      const [v, w, r, o] = await Promise.all([
        dataProvider.getVehicles(),
        dataProvider.getWarehouses(),
        dataProvider.getRoutes(),
        dataProvider.getOrders(),
      ]);
      setVehicles(v);
      setWarehouses(w);
      setRoutes(r);
      setOrders(o);
      setLoadError(null);
    } catch (err) {
      console.error("Failed to load operations data:", err);
      setLoadError(err instanceof Error ? err.message : "Operations data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();

    // Reactive subscriptions for real-time fleet, hub, order, and trip updates
    const unsubTelemetry = eventBus.subscribe("vehicle_telemetry_updated", (event) => {
      const data = event.data as any;
      if (!data) return;
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicle_id || v.code === data.vehicle_code
            ? {
                ...v,
                lat: data.lat ?? v.lat,
                lng: data.lng ?? v.lng,
                speedKmh: data.speed_kmh ?? v.speedKmh,
                heading: data.heading ?? v.heading,
                batteryPct: data.battery_pct ?? v.batteryPct,
                status: data.status ?? v.status,
              }
            : v
        )
      );
    });

    const unsubVehicleUpdated = eventBus.subscribe("vehicle_updated", (event) => {
      const data = event.data as any;
      if (!data) return;
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.id || v.code === data.code
            ? {
                ...v,
                name: data.name ?? v.name,
                model: data.model ?? v.model,
                driverName: data.driver_name ?? data.driverName ?? v.driverName,
                status: data.status ?? v.status,
                speedKmh: data.speed_kmh ?? data.speedKmh ?? v.speedKmh,
                batteryPct: data.battery_pct ?? data.batteryPct ?? v.batteryPct,
                healthScore: data.health_score ?? data.healthScore ?? v.healthScore,
              }
            : v
        )
      );
    });

    const unsubVehicleCreated = eventBus.subscribe("vehicle_created", () => {
      loadData();
    });

    const unsubWarehouseCreated = eventBus.subscribe("warehouse_created", () => {
      loadData();
    });

    const unsubWarehouseUpdated = eventBus.subscribe("warehouse_updated", (event) => {
      const data = event.data as any;
      if (!data) return;
      setWarehouses((prev) =>
        prev.map((w) =>
          vMatch(w, data)
            ? {
                ...w,
                name: data.name ?? w.name,
                status: data.status ?? w.status,
                currentUnits: data.current_units ?? data.currentUnits ?? w.currentUnits,
                capacityUnits: data.capacity_units ?? data.capacityUnits ?? w.capacityUnits,
                activeDocks: data.active_docks ?? data.activeDocks ?? w.activeDocks,
                efficiencyPct: data.efficiency_pct ?? data.efficiencyPct ?? w.efficiencyPct,
              }
            : w
        )
      );
    });

    function vMatch(w: WarehouseItem, data: any) {
      return w.id === data.id || w.code === data.code;
    }

    const unsubOrderCreated = eventBus.subscribe("order_created", () => {
      loadData();
    });

    const unsubOrderUpdated = eventBus.subscribe("order_updated", (event) => {
      const data = event.data as any;
      if (!data) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.id || o.orderNumber === data.order_number
            ? {
                ...o,
                status: data.status ?? o.status,
                vehicleId: data.vehicle_id ?? o.vehicleId,
                vehicleCode: data.vehicle_code ?? o.vehicleCode,
              }
            : o
        )
      );
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
      loadData();
    });

    const unsubDockArrival = eventBus.subscribe("dock_arrival_detected", () => {
      loadData();
    });

    const unsubDockDwell = eventBus.subscribe("dock_dwell_warning", () => {
      loadData();
    });

    const unsubDetention = eventBus.subscribe("detention_accruing", () => {
      loadData();
    });

    return () => {
      unsubTelemetry();
      unsubVehicleUpdated();
      unsubVehicleCreated();
      unsubWarehouseCreated();
      unsubWarehouseUpdated();
      unsubOrderCreated();
      unsubOrderUpdated();
      unsubTripDispatched();
      unsubDockArrival();
      unsubDockDwell();
      unsubDetention();
    };
  }, [loadData]);

  // Submit new Hub
  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataProvider.createWarehouse({
        code: hubForm.code,
        name: hubForm.name,
        city: hubForm.city,
        state: hubForm.state,
        lat: Number(hubForm.lat), lng: Number(hubForm.lng),
        capacityUnits: Number(hubForm.capacityUnits), currentUnits: Number(hubForm.currentUnits),
        dockCount: Number(hubForm.dockCount), activeDocks: Number(hubForm.activeDocks),
        efficiencyPct: Number(hubForm.efficiencyPct), status: "OPERATIONAL",
      });
      setIsAddHubOpen(false);
      setStatusMessage(`Location ${hubForm.code} (${hubForm.name}) saved to this workspace.`);
      setTimeout(() => setStatusMessage(null), 4000);
      loadData();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Location could not be saved.");
    }
  };

  // Submit new Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataProvider.createVehicle({
        code: vehicleForm.code,
        name: vehicleForm.name,
        model: vehicleForm.model,
        driverName: vehicleForm.driverName,
        lat: Number(vehicleForm.lat), lng: Number(vehicleForm.lng),
        speedKmh: Number(vehicleForm.speedKmh), batteryPct: Number(vehicleForm.batteryPct),
        healthScore: Number(vehicleForm.healthScore), status: vehicleForm.status as any,
      });
      setIsAddVehicleOpen(false);
      setStatusMessage(`Vehicle ${vehicleForm.code} saved to this workspace.`);
      setTimeout(() => setStatusMessage(null), 4000);
      loadData();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Vehicle could not be saved.");
    }
  };

  const tabs = [
    { id: "vehicles", label: "Fleet Vehicles", count: vehicles.length, icon: <Truck className="h-4 w-4" /> },
    { id: "warehouses", label: "Hub Warehouses", count: warehouses.length, icon: <Building2 className="h-4 w-4" /> },
    { id: "routes", label: "Inter-Hub Routes", count: routes.length, icon: <RouteIcon className="h-4 w-4" /> },
    { id: "orders", label: "Orders & Consignments", count: orders.length, icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 font-sans">
        {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => { setLoading(true); void loadData(); }}>Retry</Button></div>}
        {/* Top Notification Toast */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header with Quick Provision Actions */}
        <PageHeader
          eyebrow="Operational Assets · Global Topology Command"
          title="Fleet & Infrastructure Command"
          description="Manage vehicle and warehouse records used by your operations workspace. Current location updates require a connected source."
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => setIsAddHubOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-stone-600" />
                Provision Hub
              </Button>
              <Button
                onClick={() => setIsAddVehicleOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5"
              >
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                Deploy Vehicle
              </Button>
              <Link href="/simulations/new">
                <Button variant="simulation" size="sm" className="font-mono text-xs gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Simulate Allocation
                </Button>
              </Link>
            </div>
          }
        />

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="w-full md:w-72 relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <Input
              placeholder="Filter by code, city, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-8 text-xs bg-stone-100/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton Transition */}
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Synchronizing fleet telemetry with live ledger...</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            {/* 1. Fleet Vehicles Table */}
            {activeTab === "vehicles" && (
              vehicles.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="No fleet assets registered"
                  description="Your company workspace has no active trucks or transport vehicles registered yet."
                  action={
                    <Button
                      onClick={() => setIsAddVehicleOpen(true)}
                      variant="primary"
                      size="sm"
                      className="font-mono text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Deploy Fleet Vehicle
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Code</TableHead>
                        <TableHead>Model & Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Driver Pilot</TableHead>
                        <TableHead>Speed</TableHead>
                        <TableHead>Battery / Energy</TableHead>
                        <TableHead>Assigned Corridor</TableHead>
                        <TableHead className="text-right">Driver Web Pass</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles
                        .filter(
                          (v) =>
                            v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            v.driverName.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((v) => (
                          <TableRow key={v.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                              <Link
                                href={`/live-world?entityType=VEHICLE&id=${encodeURIComponent(v.code)}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-nexus-primary transition-colors text-stone-900 dark:text-stone-100 hover:text-nexus-primary"
                                title="Inspect vehicle on live map"
                              >
                                <span>{v.code}</span>
                                <ArrowUpRight className="w-3 h-3 text-stone-400" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-stone-900 dark:text-stone-100">{v.name}</div>
                              <div className="text-[10px] text-stone-500 font-mono">{v.model}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={v.status === "IN_TRANSIT" ? "healthy" : v.status === "MAINTENANCE" ? "critical" : "neutral"}
                                size="sm"
                              >
                                {v.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-medium text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                                  {v.driverName.charAt(0)}
                                </span>
                                <span>{v.driverName}</span>
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono pl-6.5">{v.driverPhone}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold">{v.speedKmh} km/h</TableCell>
                            <TableCell className="text-xs">
                              <div className="space-y-1 w-24">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                  <span className={v.batteryPct < 30 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                                    {v.batteryPct}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      v.batteryPct < 30
                                        ? "bg-rose-500"
                                        : v.batteryPct < 60
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${v.batteryPct}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-stone-600 dark:text-stone-300">
                              {v.currentRouteName || "Standby Dock"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/driver-pass?v=${encodeURIComponent(v.code)}&token=demo-token-${v.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-neutral-800 text-[11px] font-mono text-[#0071E3] hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                              >
                                <span>Launch Pass</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}

            {/* 2. Hub Warehouses Table */}
            {activeTab === "warehouses" && (
              warehouses.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No hub facilities registered"
                  description="Register your primary distribution superhubs, cold storage warehouses, or transfer cross-docks."
                  action={
                    <Button
                      onClick={() => setIsAddHubOpen(true)}
                      variant="primary"
                      size="sm"
                      className="font-mono text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Provision First Hub
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hub Code</TableHead>
                        <TableHead>Facility Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>GPS Coordinates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Units Capacity</TableHead>
                        <TableHead>Active Docks</TableHead>
                        <TableHead>Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouses
                        .filter(
                          (w) =>
                            w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            w.city.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((w) => (
                          <TableRow key={w.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <TableCell className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                              <Link
                                href={`/live-world?entityType=WAREHOUSE&id=${encodeURIComponent(w.code)}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-nexus-primary transition-colors text-stone-900 dark:text-stone-100 hover:text-nexus-primary"
                                title="Inspect hub on live map"
                              >
                                <span>{w.code}</span>
                                <ArrowUpRight className="w-3 h-3 text-stone-400" />
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-stone-900 dark:text-stone-100">{w.name}</TableCell>
                            <TableCell className="text-xs">{w.city}, {w.state}</TableCell>
                            <TableCell className="font-mono text-[11px] text-stone-500">
                              {w.lat.toFixed(4)}, {w.lng.toFixed(4)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={w.status === "OPERATIONAL" ? "healthy" : "attention"}
                                size="sm"
                              >
                                {w.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {w.currentUnits.toLocaleString()} / {w.capacityUnits.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {w.activeDocks} / {w.dockCount}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {w.efficiencyPct}%
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}

            {/* 3. Routes Table */}
            {activeTab === "routes" && (
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Code</TableHead>
                      <TableHead>Corridor Name</TableHead>
                      <TableHead>Origin Hub</TableHead>
                      <TableHead>Destination Hub</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Est. Duration</TableHead>
                      <TableHead>Traffic / Weather Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes
                      .filter(
                        (r) =>
                          r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((r) => (
                        <TableRow key={r.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                          <TableCell className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                              {r.code}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-stone-900 dark:text-stone-100">{r.name}</TableCell>
                          <TableCell className="text-xs font-mono">{r.originWarehouseName}</TableCell>
                          <TableCell className="text-xs font-mono">{r.destWarehouseName}</TableCell>
                          <TableCell className="font-mono text-xs">{r.distanceKm} km</TableCell>
                          <TableCell className="font-mono text-xs">
                            {Math.floor(r.avgDurationMins / 60)}h {r.avgDurationMins % 60}m
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={r.trafficCondition === "SEVERE_WEATHER_ALERT" ? "critical" : "healthy"}
                              size="sm"
                            >
                              {r.trafficCondition}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 4. Orders Table */}
            {activeTab === "orders" && (
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Client Consignee</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Deadline</TableHead>
                      <TableHead>Carrier Vehicle</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders
                      .filter(
                        (o) =>
                          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.destination.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((o) => (
                        <TableRow key={o.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                          <TableCell className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                              {o.orderNumber}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-stone-900 dark:text-stone-100">{o.customerName}</TableCell>
                          <TableCell className="text-xs">{o.destination}</TableCell>
                          <TableCell>
                            <Badge
                              variant={o.priority === "CRITICAL" ? "critical" : o.priority === "HIGH" ? "attention" : "neutral"}
                              size="sm"
                            >
                              {o.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={o.status === "DELAYED" ? "critical" : "healthy"}
                              size="sm"
                            >
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{formatDateTime(o.deadline)}</TableCell>
                          <TableCell className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            {o.vehicleCode || "Unassigned"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-right font-semibold">
                            {formatCurrency(o.totalCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {/* Modal: Provision Hub */}
        <AnimatePresence>
          {isAddHubOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg"
              >
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Provision Operational Hub</h3>
                    <p className="text-xs text-stone-500">Register a new distribution terminal anywhere in the world</p>
                  </div>
                  <button
                    onClick={() => setIsAddHubOpen(false)}
                    className="text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateHub} className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">HUB CODE</label>
                      <Input
                        value={hubForm.code}
                        onChange={(e) => setHubForm({ ...hubForm, code: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">CITY</label>
                      <Input
                        value={hubForm.city}
                        onChange={(e) => setHubForm({ ...hubForm, city: e.target.value })}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">FACILITY NAME</label>
                    <Input
                      value={hubForm.name}
                      onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">STATE / REGION</label><Input value={hubForm.state} onChange={(e) => setHubForm({ ...hubForm, state: e.target.value })} required className="text-xs" /></div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">LATITUDE</label>
                      <Input
                        value={hubForm.lat}
                        onChange={(e) => setHubForm({ ...hubForm, lat: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">LONGITUDE</label>
                      <Input
                        value={hubForm.lng}
                        onChange={(e) => setHubForm({ ...hubForm, lng: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">STORAGE UNITS</label>
                      <Input
                        value={hubForm.capacityUnits}
                        onChange={(e) => setHubForm({ ...hubForm, capacityUnits: e.target.value })}
                        type="number"
                        min="0"
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">DOCK COUNT</label>
                      <Input
                        value={hubForm.dockCount}
                        onChange={(e) => setHubForm({ ...hubForm, dockCount: e.target.value })}
                        type="number"
                        min="0"
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">CURRENT UNITS</label><Input value={hubForm.currentUnits} onChange={(e) => setHubForm({ ...hubForm, currentUnits: e.target.value })} type="number" min="0" required className="text-xs font-mono" /></div>
                    <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">ACTIVE DOCKS</label><Input value={hubForm.activeDocks} onChange={(e) => setHubForm({ ...hubForm, activeDocks: e.target.value })} type="number" min="0" required className="text-xs font-mono" /></div>
                  </div>
                  <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">MEASURED EFFICIENCY %</label><Input value={hubForm.efficiencyPct} onChange={(e) => setHubForm({ ...hubForm, efficiencyPct: e.target.value })} type="number" min="0" max="100" step="0.1" required className="text-xs font-mono" /></div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddHubOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold">
                      Save & Provision Hub
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Deploy Vehicle */}
        <AnimatePresence>
          {isAddVehicleOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg"
              >
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Deploy Fleet Vehicle</h3>
                    <p className="text-xs text-stone-500">Add a vehicle record. Live location updates require a connected telematics source.</p>
                  </div>
                  <button
                    onClick={() => setIsAddVehicleOpen(false)}
                    className="text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateVehicle} className="mt-4 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">VEHICLE CODE</label>
                      <Input
                        value={vehicleForm.code}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, code: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">PILOT DRIVER</label>
                      <Input
                        value={vehicleForm.driverName}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">VEHICLE NAME / CALLSIGN</label>
                    <Input
                      value={vehicleForm.name}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">MODEL</label><Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required className="text-xs" /></div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">LATITUDE</label>
                      <Input
                        value={vehicleForm.lat}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, lat: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">LONGITUDE</label>
                      <Input
                        value={vehicleForm.lng}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, lng: e.target.value })}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">SPEED (KM/H)</label>
                      <Input
                        value={vehicleForm.speedKmh}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, speedKmh: e.target.value })}
                        type="number"
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">BATTERY %</label>
                      <Input
                        value={vehicleForm.batteryPct}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, batteryPct: e.target.value })}
                        type="number"
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">HEALTH SCORE %</label><Input value={vehicleForm.healthScore} onChange={(e) => setVehicleForm({ ...vehicleForm, healthScore: e.target.value })} type="number" min="0" max="100" required className="text-xs font-mono" /></div>
                    <div><label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">INITIAL STATUS</label><select value={vehicleForm.status} onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })} className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-xs"><option value="IDLE">Idle</option><option value="IN_TRANSIT">In transit</option><option value="MAINTENANCE">Maintenance</option></select></div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddVehicleOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold">
                      Save vehicle
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
