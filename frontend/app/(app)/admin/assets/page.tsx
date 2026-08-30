'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { INITIAL_VEHICLES, INITIAL_WAREHOUSES } from '@/lib/mock-data';
import { FadeIn } from '@/components/motion';

export default function AdminAssetsPage() {
  const [search, setSearch] = React.useState('');

  const allAssets = [
    ...INITIAL_VEHICLES.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.model,
      type: 'VEHICLE',
      status: v.status,
      details: `${v.speedKmh} km/h · ${v.batteryPct}% battery`,
    })),
    ...INITIAL_WAREHOUSES.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      type: 'WAREHOUSE_HUB',
      status: 'OPERATIONAL',
      details: `${w.city}, ${w.state} · ${w.currentUnits}/${w.capacityUnits} units`,
    })),
  ];

  const filtered = allAssets.filter(
    (a) =>
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Asset Inventory</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Master Physical Assets Directory
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search assets by code, model, type..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Code</TableHead>
              <TableHead>Descriptor</TableHead>
              <TableHead>Asset Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Telemetry Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  {a.code}
                </TableCell>
                <TableCell className="text-xs font-medium">{a.name}</TableCell>
                <TableCell className="font-mono text-xs text-nexus-secondary">
                  {a.type}
                </TableCell>
                <TableCell>
                  <Badge variant={a.status === 'IN_TRANSIT' || a.status === 'OPERATIONAL' ? 'healthy' : 'neutral'}>
                    <StatusLed status={a.status === 'IN_TRANSIT' || a.status === 'OPERATIONAL' ? 'healthy' : 'neutral'} className="mr-1.5" />
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {a.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
