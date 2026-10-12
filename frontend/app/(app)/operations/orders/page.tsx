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

export default function OrdersListPage() {
  const [search, setSearch] = React.useState('');
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [importOpen, setImportOpen] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    try {
      const data = await dataProvider.getOrders();
      if (data && data.length > 0) setOrders(data);
    } catch {}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/operations" className="hover:underline">Operations</Link>
              <span>·</span>
              <span>Orders & Consignments</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Consignment Tracking & SLA Monitor
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
          </div>
        </div>

        <CsvImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          entityType="ORDERS"
          onSuccess={loadOrders}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search order number, customer, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Tracking ID</TableHead>
              <TableHead>Customer / Consignee</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>SLA Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
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
                  <Badge variant={o.status === 'DELIVERED' ? 'healthy' : o.status === 'DELAYED' ? 'attention' : 'neutral'}>
                    <StatusLed status={o.status === 'DELIVERED' ? 'healthy' : o.status === 'DELAYED' ? 'attention' : 'neutral'} className="mr-1.5" />
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/operations/orders/${o.id}`}>
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
