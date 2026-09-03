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
  Route as RouteIcon,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { RouteItem, VehicleItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { FadeIn, SpringCard } from '@/components/motion';

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.id as string;

  const [route, setRoute] = React.useState<RouteItem | null>(null);
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      dataProvider.getRoute(routeId),
      dataProvider.getVehicles(),
    ])
      .then(([r, vList]) => {
        if (mounted) {
          setRoute(r);
          setVehicles(vList);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch route details:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [routeId]);

  const assignedVehicles = route ? vehicles.filter((v) => v.currentRouteId === route.id) : [];

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 font-mono text-sm text-nexus-on-surface-variant">
          Loading route telemetry...
        </div>
      </AppShell>
    );
  }

  if (!route) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 font-mono text-sm">
          <p className="text-nexus-on-surface">Route '{routeId}' was not found.</p>
          <Link href="/operations/routes">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> Back to Routes
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/operations/routes">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Routes
              </Button>
            </Link>
            <div className="h-4 w-px bg-nexus-outline-variant/30" />
            <h1 className="text-xl font-bold font-mono text-nexus-on-surface">
              {route.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/simulations/new?targetRoute=${route.id}`}>
              <Button variant="simulation" size="sm" className="font-mono text-xs gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Simulate Reroute
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Distance</span>
              <RouteIcon className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{route.distanceKm} km</div>
            <p className="text-xs text-nexus-on-surface-variant">Standard corridor track</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Avg Duration</span>
              <Clock className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{Math.round(route.avgDurationMins / 60)}h {route.avgDurationMins % 60}m</div>
            <p className="text-xs text-nexus-on-surface-variant">Includes typical transit buffer</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Traffic Condition</span>
              <StatusLed status={route.trafficCondition === 'SEVERE_WEATHER_ALERT' || route.trafficCondition === 'HEAVY_CONGESTION' ? 'critical' : route.trafficCondition === 'MODERATE_TRAFFIC' ? 'attention' : 'healthy'} />
            </div>
            <div className="text-sm font-bold font-mono text-nexus-on-surface">{route.trafficCondition.replace(/_/g, ' ')}</div>
            <p className="text-xs text-nexus-on-surface-variant">Risk Score: {route.riskScore}/100</p>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <div className="flex items-center justify-between text-nexus-on-surface-variant text-xs font-mono uppercase">
              <span>Active Assets</span>
              <Truck className="h-4 w-4 text-nexus-secondary" />
            </div>
            <div className="text-2xl font-bold font-mono text-nexus-on-surface">{assignedVehicles.length}</div>
            <p className="text-xs text-nexus-on-surface-variant">Fleet units on corridor</p>
          </SpringCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Assigned Vehicles on Corridor ({assignedVehicles.length})
              </h3>
              {assignedVehicles.length === 0 ? (
                <p className="text-xs text-nexus-on-surface-variant">No vehicles currently traversing this route.</p>
              ) : (
                <div className="space-y-2">
                  {assignedVehicles.map((v) => (
                    <Link key={v.id} href={`/operations/vehicles/${v.id}`}>
                      <div className="p-3 rounded-lg border border-nexus-surface-container-high hover:bg-nexus-surface-container/50 transition-colors flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-nexus-secondary" />
                          <span className="font-mono font-bold">{v.code}</span>
                          <span className="text-nexus-on-surface-variant">({v.model})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono">{v.speedKmh} km/h</span>
                          <Badge variant="healthy">{v.status}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SpringCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Waypoints & Terminals
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{route.originWarehouseName}</span>
                </div>
                <div className="pl-6 text-nexus-on-surface-variant border-l border-dashed border-nexus-outline-variant/50 space-y-2 py-1">
                  {route.waypoints?.map((w, idx) => (
                    <p key={idx}>{w.label} ({w.lat.toFixed(2)}, {w.lng.toFixed(2)})</p>
                  )) || <p>Direct Highway Segment</p>}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-nexus-secondary shrink-0" />
                  <span>{route.destWarehouseName}</span>
                </div>
              </div>
            </SpringCard>
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
