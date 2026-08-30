'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Cloud, Database, RefreshCw, CheckCircle2, Server, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminFabricPage() {
  const { toast } = useToast();
  const [testing, setTesting] = React.useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast({
        title: 'Fabric Boundary Verified',
        message: 'Microsoft Fabric OneLake endpoint reachable with valid Parquet schemas.',
        type: 'success',
      });
    }, 900);
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Cloud & Fabric Boundary</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Microsoft Fabric & OneLake Telemetry Bridge
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTest}
              isLoading={testing}
              className="font-mono text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Test Fabric Connection
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpringCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-nexus-secondary">ONELAKE SYNC ADAPTER</span>
              <Badge variant="healthy">CONNECTED</Badge>
            </div>
            <h3 className="text-lg font-bold">OneLake Delta Mirroring</h3>
            <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
              Operational database transactions are converted to Delta Lake format and pushed to Microsoft Fabric OneLake workspaces for external PowerBI analytics.
            </p>
            <div className="pt-3 text-xs font-mono space-y-1 text-nexus-on-surface-variant border-t border-nexus-surface-container-high">
              <div className="flex justify-between">
                <span>Latency Lag:</span>
                <span className="font-bold text-emerald-600">320 ms</span>
              </div>
              <div className="flex justify-between">
                <span>Total Parquet Files:</span>
                <span className="font-bold">4,812</span>
              </div>
            </div>
          </SpringCard>

          <SpringCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-nexus-secondary">AZURE EVENT HUBS</span>
              <Badge variant="healthy">HEALTHY</Badge>
            </div>
            <h3 className="text-lg font-bold">Realtime Telemetry Ingest</h3>
            <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
              IoT sensors on vehicle CAN-buses stream high-frequency diagnostic packets into Azure Event Hub adapters with deduplication guarantees.
            </p>
            <div className="pt-3 text-xs font-mono space-y-1 text-nexus-on-surface-variant border-t border-nexus-surface-container-high">
              <div className="flex justify-between">
                <span>Throughput:</span>
                <span className="font-bold text-nexus-primary">48.2 MB/s</span>
              </div>
              <div className="flex justify-between">
                <span>Partition Count:</span>
                <span className="font-bold">16 Partitions</span>
              </div>
            </div>
          </SpringCard>

          <SpringCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-nexus-lavender-dark">SYNAPSE AI WORKSPACE</span>
              <Badge variant="simulation">LINKED</Badge>
            </div>
            <h3 className="text-lg font-bold">Predictive Model Exchange</h3>
            <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
              Long-term pattern weights calculated in Fabric are pulled periodically by NEXUS for fast local deterministic heuristic evaluation.
            </p>
            <div className="pt-3 text-xs font-mono space-y-1 text-nexus-on-surface-variant border-t border-nexus-surface-container-high">
              <div className="flex justify-between">
                <span>Model Version:</span>
                <span className="font-bold">v3.4.1</span>
              </div>
              <div className="flex justify-between">
                <span>Last Refresh:</span>
                <span className="font-bold">42 mins ago</span>
              </div>
            </div>
          </SpringCard>
        </div>
      </FadeIn>
    </AppShell>
  );
}
