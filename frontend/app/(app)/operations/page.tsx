"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import { Input } from "@/components/ui/input";
import { Truck, Building2, Route as RouteIcon, Package, Search, Sparkles, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import {
  VehicleItem,
  WarehouseItem,
  RouteItem,
  OrderItem,
} from "@/lib/mock-data";
import { dataProvider } from "@/lib/data-provider";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = React.useState("vehicles");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [routes, setRoutes] = React.useState<RouteItem[]>([]);
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      dataProvider.getVehicles(),
      dataProvider.getWarehouses(),
      dataProvider.getRoutes(),
      dataProvider.getOrders(),
    ])
      .then(([v, w, r, o]) => {
        if (mounted) {
          setVehicles(v);
          setWarehouses(w);
          setRoutes(r);
          setOrders(o);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch operations data:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const tabs = [
    { id: "vehicles", label: "Fleet Vehicles", count: vehicles.length, icon: <Truck className="h-4 w-4" /> },
    { id: "warehouses", label: "Hub Warehouses", count: warehouses.length, icon: <Building2 className="h-4 w-4" /> },
    { id: "routes", label: "Inter-Hub Routes", count: routes.length, icon: <RouteIcon className="h-4 w-4" /> },
    { id: "orders", label: "Orders & Consignments", count: orders.length, icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Operational Assets</span>
              <span>·</span>
              <span>Central Registry</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Fleet & Infrastructure Command
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono-data text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Simulate Allocation
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="w-full md:w-72">
            <Input
              placeholder="Search by code, city, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* 1. Fleet Vehicles Table */}
        {activeTab === "vehicles" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Code</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Route</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Battery / Fuel</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableRow key={v.id}>
                    <TableCell className="font-mono-data font-bold">{v.code}</TableCell>
                    <TableCell className="text-xs">{v.model}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusLed
                          status={v.healthScore < 80 ? "CRITICAL" : v.status === "IN_TRANSIT" ? "HEALTHY" : "OFFLINE"}
                          size="sm"
                        />
                        <span className="text-xs font-mono-data">{v.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono-data text-nexus-on-surface-variant">
                      {v.currentRouteName || "Standby / Depoted"}
                    </TableCell>
                    <TableCell className="font-mono-data text-xs">{v.speedKmh} km/h</TableCell>
                    <TableCell className="font-mono-data text-xs">{v.batteryPct}%</TableCell>
                    <TableCell className="text-xs">{v.driverName}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/simulations/new?vehicleId=${v.id}`}>
                        <Button variant="ghost" size="sm" className="font-mono-data text-xs">
                          Simulate <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {/* 2. Warehouses Table */}
        {activeTab === "warehouses" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hub Code</TableHead>
                <TableHead>Facility Name</TableHead>
                <TableHead>Location</TableHead>
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
                  <TableRow key={w.id}>
                    <TableCell className="font-mono-data font-bold">{w.code}</TableCell>
                    <TableCell className="text-xs font-semibold">{w.name}</TableCell>
                    <TableCell className="text-xs">{w.city}, {w.state}</TableCell>
                    <TableCell>
                      <Badge
                        variant={w.status === "OPERATIONAL" ? "healthy" : "attention"}
                        size="sm"
                      >
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-data text-xs">
                      {w.currentUnits.toLocaleString()} / {w.capacityUnits.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono-data text-xs">
                      {w.activeDocks} / {w.dockCount}
                    </TableCell>
                    <TableCell className="font-mono-data text-xs font-semibold text-emerald-700">
                      {w.efficiencyPct}%
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}

        {/* 3. Routes Table */}
        {activeTab === "routes" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Code</TableHead>
                <TableHead>Corridor Name</TableHead>
                <TableHead>Origin Hub</TableHead>
                <TableHead>Destination Hub</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Est. Duration</TableHead>
                <TableHead>Traffic Status</TableHead>
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
                  <TableRow key={r.id}>
                    <TableCell className="font-mono-data font-bold">{r.code}</TableCell>
                    <TableCell className="text-xs font-semibold">{r.name}</TableCell>
                    <TableCell className="text-xs font-mono-data">{r.originWarehouseName}</TableCell>
                    <TableCell className="text-xs font-mono-data">{r.destWarehouseName}</TableCell>
                    <TableCell className="font-mono-data text-xs">{r.distanceKm} km</TableCell>
                    <TableCell className="font-mono-data text-xs">{Math.floor(r.avgDurationMins / 60)}h {r.avgDurationMins % 60}m</TableCell>
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
        )}

        {/* 4. Orders Table */}
        {activeTab === "orders" && (
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
                  <TableRow key={o.id}>
                    <TableCell className="font-mono-data font-bold">{o.orderNumber}</TableCell>
                    <TableCell className="text-xs font-semibold">{o.customerName}</TableCell>
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
                    <TableCell className="font-mono-data text-xs">{formatDateTime(o.deadline)}</TableCell>
                    <TableCell className="font-mono-data text-xs text-nexus-secondary font-semibold">
                      {o.vehicleCode || "Unassigned"}
                    </TableCell>
                    <TableCell className="font-mono-data text-xs text-right font-semibold">
                      {formatCurrency(o.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  );
}
