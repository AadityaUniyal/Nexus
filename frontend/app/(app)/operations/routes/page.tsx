'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Route as RouteIcon, Search, ArrowRight } from 'lucide-react';
import { INITIAL_ROUTES, RouteItem } from '@/lib/mock-data';
import { FadeIn } from '@/components/motion';

export default function RoutesListPage() {
  const [search, setSearch] = React.useState('');
  const [routes] = React.useState<RouteItem[]>(INITIAL_ROUTES);

  const filtered = routes.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.originWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
      r.destWarehouseName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/operations" className="hover:underline">Operations</Link>
              <span>·</span>
              <span>Inter-Hub Routes</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Corridor Performance & Risk Monitoring
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/live-world">
              <Button variant="secondary" size="sm">
                View Corridors in 3D
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search corridor or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Corridor Name</TableHead>
              <TableHead>Origin → Destination</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Typical Duration</TableHead>
              <TableHead>Traffic / Condition</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  <Link href={`/operations/routes/${r.id}`} className="hover:underline flex items-center gap-1.5">
                    <RouteIcon className="h-3.5 w-3.5 text-nexus-secondary" />
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-medium">{r.originWarehouseName} → {r.destWarehouseName}</TableCell>
                <TableCell className="font-mono text-xs">{r.distanceKm} km</TableCell>
                <TableCell className="font-mono text-xs">{Math.round(r.avgDurationMins / 60)}h {r.avgDurationMins % 60}m</TableCell>
                <TableCell>
                  <Badge variant={r.trafficCondition === 'SEVERE_WEATHER_ALERT' || r.trafficCondition === 'HEAVY_CONGESTION' ? 'critical' : r.trafficCondition === 'MODERATE_TRAFFIC' ? 'attention' : 'healthy'}>
                    <StatusLed status={r.trafficCondition === 'SEVERE_WEATHER_ALERT' || r.trafficCondition === 'HEAVY_CONGESTION' ? 'critical' : r.trafficCondition === 'MODERATE_TRAFFIC' ? 'attention' : 'healthy'} className="mr-1.5" />
                    {r.trafficCondition.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-secondary font-bold">
                  {r.riskScore}/100 Risk
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/operations/routes/${r.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-xs">
                      Inspect <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
