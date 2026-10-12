'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Building2, Search, ArrowRight, Download, Upload } from 'lucide-react';
import { WarehouseItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { FadeIn } from '@/components/motion';
import { exportToCsv } from '@/lib/csv-export';
import { CsvImportModal } from '@/components/forms/CsvImportModal';

export default function WarehousesListPage() {
  const [search, setSearch] = React.useState('');
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>([]);
  const [importOpen, setImportOpen] = React.useState(false);

  const loadWarehouses = React.useCallback(async () => {
    try {
      const data = await dataProvider.getWarehouses();
      if (data && data.length > 0) setWarehouses(data);
    } catch {}
  }, []);

  React.useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleExportCsv = () => {
    const exportData = warehouses.map((w) => ({
      Code: w.code,
      Name: w.name,
      City: w.city,
      State: w.state,
      Status: w.status,
      CapacityUnits: w.capacityUnits,
      CurrentUnits: w.currentUnits,
      DocksTotal: w.dockCount,
      DocksActive: w.activeDocks,
      EfficiencyPct: w.efficiencyPct,
      Latitude: w.lat,
      Longitude: w.lng,
    }));
    exportToCsv('nexus_warehouses.csv', exportData);
  };

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.city.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/operations" className="hover:underline">Operations</Link>
              <span>·</span>
              <span>Hub Warehouses</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Distribution Hubs & Dock Digital Twins
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs font-mono"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="text-xs font-mono text-emerald-600 border-emerald-500/40"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import CSV
            </Button>
            <Link href="/live-world">
              <Button variant="secondary" size="sm">
                View on World Map
              </Button>
            </Link>
          </div>
        </div>

        <CsvImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          entityType="WAREHOUSES"
          onSuccess={loadWarehouses}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search by hub name, code, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hub Code</TableHead>
              <TableHead>Facility Name</TableHead>
              <TableHead>Metro Region</TableHead>
              <TableHead>Capacity Utilization</TableHead>
              <TableHead>Active Docks / Gates</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((w) => {
              const utilPct = Math.round((w.currentUnits / w.capacityUnits) * 100);
              return (
                <TableRow key={w.id}>
                  <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                    <Link href={`/operations/warehouses/${w.id}`} className="hover:underline flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-nexus-secondary" />
                      {w.code}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{w.name}</TableCell>
                  <TableCell className="text-xs text-nexus-on-surface-variant">{w.city}, {w.state}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-nexus-surface-container rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            utilPct > 85 ? 'bg-amber-500' : utilPct > 95 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{utilPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {w.activeDocks} / {w.dockCount} Docks Active
                  </TableCell>
                  <TableCell className="font-mono text-xs text-nexus-secondary font-bold">
                    {w.efficiencyPct}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/operations/warehouses/${w.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-xs">
                        Inspect <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
