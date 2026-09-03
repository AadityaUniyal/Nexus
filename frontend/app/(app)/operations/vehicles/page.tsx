'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Truck, Search, ArrowRight } from 'lucide-react';
import { VehicleItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { FadeIn } from '@/components/motion';

export default function VehiclesListPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [vehicles, setVehicles] = React.useState<VehicleItem[]>([]);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await dataProvider.getVehicles();
        if (data && data.length > 0) setVehicles(data);
      } catch {}
    }
    load();
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.driverName && v.driverName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/operations" className="hover:underline">Operations</Link>
              <span>·</span>
              <span>Fleet Vehicles</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Vehicle Telemetry & Fleet Registry
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/live-world">
              <Button variant="secondary" size="sm">
                View in 3D World
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Filter by vehicle code, model, driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses ({vehicles.length})</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="IDLE">Idle</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="LOADING">Loading</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
        </div>

        {/* Vehicle Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle Code</TableHead>
              <TableHead>Model / Class</TableHead>
              <TableHead>Operational Status</TableHead>
              <TableHead>Assigned Driver</TableHead>
              <TableHead>Telemetry (Speed / Battery)</TableHead>
              <TableHead>GPS Coordinates</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  <Link href={`/operations/vehicles/${v.id}`} className="hover:underline flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-nexus-secondary" />
                    {v.code}
                  </Link>
                </TableCell>
                <TableCell className="text-xs">{v.model}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      v.status === 'IN_TRANSIT'
                        ? 'healthy'
                        : v.status === 'MAINTENANCE' || v.status === 'OUT_OF_SERVICE'
                        ? 'critical'
                        : 'neutral'
                    }
                  >
                    <StatusLed
                      status={
                        v.status === 'IN_TRANSIT'
                          ? 'healthy'
                          : v.status === 'MAINTENANCE' || v.status === 'OUT_OF_SERVICE'
                          ? 'critical'
                          : 'neutral'
                      }
                      className="mr-1.5"
                    />
                    {v.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-nexus-on-surface-variant font-medium">
                  {v.driverName || 'Unassigned'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {v.speedKmh} km/h · {v.batteryPct}%
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/operations/vehicles/${v.id}`}>
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
