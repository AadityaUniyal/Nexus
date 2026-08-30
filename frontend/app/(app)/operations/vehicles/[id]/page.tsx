'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import {
  ArrowLeft,
  Truck,
  Battery,
  Gauge,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { INITIAL_VEHICLES, INITIAL_ORDERS, INITIAL_INCIDENTS } from '@/lib/mock-data';
import { FadeIn, SpringCard } from '@/components/motion';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const vehicle = INITIAL_VEHICLES.find((v) => v.id === vehicleId) || INITIAL_VEHICLES[0];
  const relatedOrders = INITIAL_ORDERS.filter((o) => o.vehicleId === vehicle.id);
  const relatedIncidents = INITIAL_INCIDENTS.filter(
    (i) => i.affectedEntityType === 'VEHICLE' && i.affectedEntityId === vehicle.id
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/operations/vehicles">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Vehicles
              </Button>
            </Link>
            <div className="h-4 w-px bg-nexus-outline-variant/30" />
            <h1 className="text-xl font-bold font-mono text-nexus-on-surface">
              {vehicle.code} · {vehicle.model}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/simulations/new?targetVehicle=${vehicle.id}`}>
              <Button variant="simulation" size="sm" className="font-mono text-xs gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Simulate Reroute
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Status</span>
              <StatusLed
                status={
                  vehicle.status === 'IN_TRANSIT'
                    ? 'healthy'
                    : vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE'
                    ? 'critical'
                    : 'neutral'
                }
              />
            </div>
            <div className="text-lg font-bold font-mono text-nexus-on-surface">{vehicle.status}</div>
            <p className="text-xs text-nexus-on-surface-variant">Last ping: 2 seconds ago</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Current Velocity</span>
              <Gauge className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-lg font-bold font-mono text-nexus-on-surface">{vehicle.speedKmh} km/h</div>
            <p className="text-xs text-nexus-on-surface-variant">Engine health: {vehicle.healthScore}/100</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Battery Level</span>
              <Battery className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-lg font-bold font-mono text-nexus-on-surface">{vehicle.batteryPct}%</div>
            <p className="text-xs text-nexus-on-surface-variant">Active telemetry feed</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Payload Capacity</span>
              <Truck className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-lg font-bold font-mono text-nexus-on-surface">
              {vehicle.currentLoadKg} / {vehicle.capacityKg} kg
            </div>
            <p className="text-xs text-nexus-on-surface-variant">{relatedOrders.length} active consignments</p>
          </SpringCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Spatial Telemetry & GPS Coordinates
              </h3>
              <div className="p-4 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-nexus-on-surface-variant block">Latitude</span>
                  <span className="font-bold">{vehicle.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Longitude</span>
                  <span className="font-bold">{vehicle.lng.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Assigned Driver</span>
                  <span className="font-bold">{vehicle.driverName || 'None'}</span>
                </div>
                <div>
                  <span className="text-nexus-on-surface-variant block">Driver Contact</span>
                  <span className="font-bold">{vehicle.driverPhone || 'N/A'}</span>
                </div>
              </div>
            </SpringCard>

            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Active Manifest & Consignments ({relatedOrders.length})
              </h3>
              {relatedOrders.length === 0 ? (
                <p className="text-xs text-nexus-on-surface-variant">No active orders assigned to this vehicle.</p>
              ) : (
                <div className="space-y-2">
                  {relatedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg border border-nexus-surface-container-high flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold">{ord.orderNumber}</span>
                        <p className="text-nexus-on-surface-variant">{ord.destination} · {ord.itemsCount} items</p>
                      </div>
                      <Badge variant={ord.status === 'DELIVERED' ? 'healthy' : 'neutral'}>
                        {ord.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </SpringCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-critical">
                Active Risk Flags ({relatedIncidents.length})
              </h3>
              {relatedIncidents.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> No active risk flags or anomalies.
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedIncidents.map((inc) => (
                    <Link key={inc.id} href={`/incidents/${inc.id}`}>
                      <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-700">{inc.code}</span>
                          <Badge variant="critical">{inc.severity}</Badge>
                        </div>
                        <p className="text-nexus-on-surface line-clamp-2">{inc.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SpringCard>
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
