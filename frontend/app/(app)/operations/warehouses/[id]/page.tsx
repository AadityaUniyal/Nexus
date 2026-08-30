'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import {
  ArrowLeft,
  Building2,
  Boxes,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { INITIAL_WAREHOUSES, INITIAL_ORDERS } from '@/lib/mock-data';
import { FadeIn, SpringCard } from '@/components/motion';

export default function WarehouseDetailPage() {
  const params = useParams();
  const warehouseId = params.id as string;

  const warehouse = INITIAL_WAREHOUSES.find((w) => w.id === warehouseId) || INITIAL_WAREHOUSES[0];
  const originOrders = INITIAL_ORDERS.filter((o) => o.warehouseId === warehouse.id);
  const utilPct = Math.round((warehouse.currentUnits / warehouse.capacityUnits) * 100);

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/operations/warehouses">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Warehouses
              </Button>
            </Link>
            <div className="h-4 w-px bg-nexus-outline-variant/30" />
            <h1 className="text-xl font-bold font-mono text-nexus-on-surface">
              {warehouse.code} · {warehouse.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/simulations/new">
              <Button variant="simulation" size="sm" className="font-mono text-xs">
                Simulate Dock Reallocation
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Capacity Utilization</span>
              <Boxes className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{utilPct}%</div>
            <p className="text-xs text-nexus-on-surface-variant">{warehouse.currentUnits} / {warehouse.capacityUnits} units</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Dock Doors Active</span>
              <Activity className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{warehouse.activeDocks} / {warehouse.dockCount}</div>
            <p className="text-xs text-nexus-on-surface-variant">Efficiency: {warehouse.efficiencyPct}%</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Operational Status</span>
              <TrendingUp className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{warehouse.status}</div>
            <p className="text-xs text-nexus-on-surface-variant">Active operational node</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Location Coordinates</span>
              <Building2 className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-sm font-bold font-mono text-nexus-on-surface">{warehouse.city}, {warehouse.state}</div>
            <p className="text-xs text-nexus-on-surface-variant font-mono">{warehouse.lat.toFixed(4)}, {warehouse.lng.toFixed(4)}</p>
          </SpringCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Origin Consignments & Orders Dispatched ({originOrders.length})
              </h3>
              <div className="space-y-2">
                {originOrders.map((ord) => (
                  <div key={ord.id} className="p-3 rounded-lg border border-nexus-surface-container-high flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold">{ord.orderNumber}</span>
                      <p className="text-nexus-on-surface-variant">{ord.destination} · {ord.itemsCount} items</p>
                    </div>
                    <Badge variant="healthy">{ord.status}</Badge>
                  </div>
                ))}
              </div>
            </SpringCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Dock Bay Telemetry
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>Bay 01 - 04 (Inbound Cross-dock)</span>
                  <span className="text-emerald-600 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>Bay 05 - 08 (High-Cube Outbound)</span>
                  <span className="text-emerald-600 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>Bay 09 - 12 (Cold Storage Airlock)</span>
                  <span className="text-nexus-on-surface-variant font-bold">AVAILABLE</span>
                </div>
              </div>
            </SpringCard>
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
