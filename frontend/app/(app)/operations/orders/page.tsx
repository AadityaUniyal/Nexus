'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Package, Search, ArrowRight, Download, Upload } from 'lucide-react';
import { OrderItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';
import { exportToCsv } from '@/lib/csv-export';
import { CsvImportModal } from '@/components/forms/CsvImportModal';

import { PageHeader } from '@/components/ui/PageHeader';
import { DataProvenanceBadge } from '@/components/ui/DataProvenanceBadge';
import { X, RefreshCw } from 'lucide-react';

export default function OrdersListPage() {
  const [search, setSearch] = React.useState('');
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [importOpen, setImportOpen] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await dataProvider.getOrders();
      if (data && data.length > 0) setOrders(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleExportCsv = () => {
    const exportData = orders.map((o) => ({
      OrderNumber: o.orderNumber,
      CustomerName: o.customerName,
      Destination: o.destination,
      ItemCount: o.itemsCount,
      TotalCost: o.totalCost,
      Priority: o.priority,
      Status: o.status,
      Deadline: o.deadline,
      VehicleCode: o.vehicleCode || 'Unassigned',
    }));
    exportToCsv('nexus_freight_orders.csv', exportData);
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <PageHeader
          eyebrow="Operations · Shipments Manifest"
          title="Consignments & SLA Monitor"
          description="Real-time freight custody, scheduled delivery windows, and destination SLAs across active corridors."
          actions={
            <div className="flex items-center gap-2 flex-wrap">
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
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import CSV
              </Button>
            </div>
          }
        />

        <CsvImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          entityType="ORDERS"
          onSuccess={loadOrders}
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-nexus-surface-container border border-nexus-outline/20">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search by ID, customer, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant">
            <span>Showing {filtered.length} of {orders.length} consignments</span>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch('')}
                className="h-7 px-2 text-xs font-mono"
              >
                Reset query
              </Button>
            )}
          </div>
        </div>

        {/* Shipments Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Customer / Consignee</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Declared Value</TableHead>
              <TableHead>SLA Promised ETA</TableHead>
              <TableHead>Status / Provenance</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-xs font-mono text-nexus-on-surface-variant">
                  {search ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-nexus-on-surface">No shipments match &ldquo;{search}&rdquo;</p>
                      <p className="text-[11px]">Check the tracking ID or clear the search query.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearch('')}
                        className="mt-2 text-xs font-mono mx-auto"
                      >
                        Clear search filter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Package className="h-8 w-8 mx-auto text-stone-400 opacity-60" />
                      <p className="font-semibold text-nexus-on-surface">Your workspace has no shipments yet.</p>
                      <p className="text-[11px]">Import a CSV manifest or connect a data source to begin tracking.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImportOpen(true)}
                        className="mt-2 text-xs font-mono mx-auto"
                      >
                        Import First Manifest
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                    <Link href={`/operations/orders/${o.id}`} className="hover:underline flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-nexus-secondary" />
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{o.customerName}</TableCell>
                  <TableCell className="text-xs text-nexus-on-surface-variant">{o.destination}</TableCell>
                  <TableCell className="font-mono text-xs">{o.itemsCount} pkgs</TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{formatCurrency(o.totalCost)}</TableCell>
                  <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                    {formatDateTime(o.deadline)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={o.status === 'DELIVERED' ? 'healthy' : o.status === 'DELAYED' ? 'attention' : 'neutral'}>
                        <StatusLed status={o.status === 'DELIVERED' ? 'healthy' : o.status === 'DELAYED' ? 'attention' : 'neutral'} className="mr-1.5" />
                        {o.status}
                      </Badge>
                      <DataProvenanceBadge
                        status={o.status === 'DELIVERED' ? 'CONFIRMED' : o.status === 'DELAYED' ? 'ESTIMATED' : 'REPORTED'}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/operations/orders/${o.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-xs">
                        Inspect <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
