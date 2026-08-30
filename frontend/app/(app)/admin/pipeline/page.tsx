'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Database, RefreshCw } from 'lucide-react';
import { INITIAL_PIPELINE, PipelineHealthItem } from '@/lib/mock-data';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminPipelinePage() {
  const { toast } = useToast();
  const [pipeline, setPipeline] = React.useState<PipelineHealthItem[]>(INITIAL_PIPELINE);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Data Pipeline Synced',
        message: 'All Bronze, Silver, Gold, and OneLake stages synchronized.',
        type: 'success',
      });
    }, 1000);
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Data Architecture</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Data Pipeline & Medallion Ingestion
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerSync}
              isLoading={isSyncing}
              className="font-mono text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Trigger Ingestion Sync
            </Button>
          </div>
        </div>

        {/* Medallion Pipeline Visual Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SpringCard className="p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">Bronze Layer</span>
            <h3 className="text-sm font-bold">Raw Telemetry Ingestion</h3>
            <p className="text-xs text-nexus-on-surface-variant">Unfiltered GPS & IoT payloads</p>
            <div className="pt-2 text-xs font-mono text-emerald-600 font-bold">● 1.2M events / hr</div>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">Silver Layer</span>
            <h3 className="text-sm font-bold">Cleaned & Conformed</h3>
            <p className="text-xs text-nexus-on-surface-variant">Validated schemas & geo-fencing</p>
            <div className="pt-2 text-xs font-mono text-emerald-600 font-bold">● Zero drift detected</div>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Gold Layer</span>
            <h3 className="text-sm font-bold">Aggregated Operational KPIs</h3>
            <p className="text-xs text-nexus-on-surface-variant">SLA adherence & carrier metrics</p>
            <div className="pt-2 text-xs font-mono text-emerald-600 font-bold">● Refreshed every 15s</div>
          </SpringCard>

          <SpringCard className="p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Microsoft Fabric</span>
            <h3 className="text-sm font-bold">OneLake Sync Adapter</h3>
            <p className="text-xs text-nexus-on-surface-variant">Delta Parquet cloud mirrored</p>
            <div className="pt-2 text-xs font-mono text-emerald-600 font-bold">● Synced (0.4s lag)</div>
          </SpringCard>
        </div>

        {/* Pipeline Nodes Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pipeline Source</TableHead>
              <TableHead>Source Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records Today</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Last Synchronized</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipeline.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  <div className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-nexus-secondary" />
                    {p.sourceName}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{p.sourceType}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'HEALTHY' ? 'healthy' : p.status === 'DEGRADED' ? 'attention' : 'critical'}>
                    <StatusLed status={p.status === 'HEALTHY' ? 'healthy' : p.status === 'DEGRADED' ? 'attention' : 'critical'} className="mr-1.5" />
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-nexus-secondary">
                  {p.recordsToday.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.latencyMs} ms</TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">{p.lastSyncAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
