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
  Globe,
  MapPin,
  CheckCircle2,
  X,
  Zap,
} from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  RouteItem,
  OrderItem,
} from "@/lib/mock-data";
import { dataProvider } from "@/lib/data-provider";
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

  // Modal States
  const [isAddHubOpen, setIsAddHubOpen] = React.useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<string>("custom");
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  // Form states for new Hub
  const [hubForm, setHubForm] = React.useState({
    code: "WH-DED-01",
    name: "Dehradun Intermodal Superhub",
    city: "Dehradun",
    state: "Uttarakhand",
    lat: "30.3165",
    lng: "78.0322",
    capacityUnits: "60000",
    dockCount: "16",
  });

  // Form states for new Vehicle
  const [vehicleForm, setVehicleForm] = React.useState({
    code: "NX-DED-104",
    name: "Himalayan Prime Rig",
    model: "Class-8 EV Hauler",
    driverName: "Rohit Bhatt",
    lat: "30.3165",
    lng: "78.0322",
    speedKmh: "65",
    batteryPct: "92",
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
    } catch (err) {
      console.error("Failed to load operations data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Regional Setup Preset
  const handleApplyPreset = async (presetKey: "dehradun" | "delhi" | "london" | "tokyo" | "chicago", label: string) => {
    setLoading(true);
    try {
      await dataProvider.provisionPreset(presetKey);
      setActivePreset(presetKey);
      await loadData();
      setStatusMessage(`Successfully activated ${label}! Topology synchronized.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      console.error("Failed to switch preset:", e);
    } finally {
      setLoading(false);
    }
  };

  // Submit new Hub
  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataProvider.createWarehouse({
        code: hubForm.code,
        name: hubForm.name,
        city: hubForm.city,
        state: hubForm.state,
        lat: parseFloat(hubForm.lat) || 30.3165,
        lng: parseFloat(hubForm.lng) || 78.0322,
        capacityUnits: parseInt(hubForm.capacityUnits) || 50000,
        currentUnits: Math.floor((parseInt(hubForm.capacityUnits) || 50000) * 0.65),
        dockCount: parseInt(hubForm.dockCount) || 12,
        activeDocks: Math.floor((parseInt(hubForm.dockCount) || 12) * 0.7),
        efficiencyPct: 96,
        status: "OPERATIONAL",
      });
      setIsAddHubOpen(false);
      setStatusMessage(`Hub ${hubForm.code} (${hubForm.name}) registered in live ledger!`);
      setTimeout(() => setStatusMessage(null), 4000);
      loadData();
    } catch (err) {
      console.error("Failed to create hub:", err);
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
        lat: parseFloat(vehicleForm.lat) || 30.3165,
        lng: parseFloat(vehicleForm.lng) || 78.0322,
        speedKmh: parseFloat(vehicleForm.speedKmh) || 60,
        batteryPct: parseInt(vehicleForm.batteryPct) || 85,
        status: "IN_TRANSIT",
      });
      setIsAddVehicleOpen(false);
      setStatusMessage(`Vehicle ${vehicleForm.code} deployed to active dispatch!`);
      setTimeout(() => setStatusMessage(null), 4000);
      loadData();
    } catch (err) {
      console.error("Failed to deploy vehicle:", err);
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
          description="Provision distribution hubs, monitor live autonomous EV fleet health, and dispatch intermodal consignments."
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

        {/* Global Regional Topology Presets Switcher (Apple Control Strip) */}
        <div className="p-2.5 bg-stone-200/50 dark:bg-stone-900/70 backdrop-blur-xl rounded-2xl border border-stone-300/40 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold text-stone-900 dark:text-stone-100">Regional Topology:</span>
            <span className="text-stone-500 text-[11px] font-normal hidden sm:inline">
              1-click synchronous deployment for active grid
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {[
              { key: "dehradun" as const, label: "Dehradun / India", flag: "🇮🇳" },
              { key: "delhi" as const, label: "Delhi NCR", flag: "🇮🇳" },
              { key: "london" as const, label: "London / UK", flag: "🇬🇧" },
              { key: "tokyo" as const, label: "Tokyo / Japan", flag: "🇯🇵" },
              { key: "chicago" as const, label: "US Central", flag: "🇺🇸" },
            ].map((preset) => {
              const isSelected = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => handleApplyPreset(preset.key, preset.label)}
                  className={`relative px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium select-none ${
                    isSelected
                      ? "text-stone-900 dark:text-white font-bold shadow-xs bg-white dark:bg-stone-800 border border-black/5 dark:border-white/15"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs">{preset.flag}</span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                        <TableHead>Health Score</TableHead>
                        <TableHead>Assigned Corridor</TableHead>
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
                              <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                {v.code}
                              </span>
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
                            <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {v.healthScore}%
                            </TableCell>
                            <TableCell className="text-xs text-stone-600 dark:text-stone-300">
                              {v.currentRouteName || "Standby Dock"}
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
                              <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                {w.code}
                              </span>
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
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">DOCK COUNT</label>
                      <Input
                        value={hubForm.dockCount}
                        onChange={(e) => setHubForm({ ...hubForm, dockCount: e.target.value })}
                        type="number"
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

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
                    <p className="text-xs text-stone-500">Commission an active hauler or delivery unit to the network</p>
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
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono font-bold text-stone-600 block mb-1">BATTERY %</label>
                      <Input
                        value={vehicleForm.batteryPct}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, batteryPct: e.target.value })}
                        type="number"
                        className="text-xs font-mono"
                      />
                    </div>
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
                      Commission & Deploy
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
