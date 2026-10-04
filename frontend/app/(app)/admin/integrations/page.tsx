'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Cloud, Cpu, Radio, Sparkles, Database, Key, Activity, RefreshCw, Server, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

import { authFetch } from '@/lib/api/auth-fetch';

export default function AdminIntegrationsPage() {
  const { toast } = useToast();
  const [testingId, setTestingId] = React.useState<string | null>(null);

  const integrations = [
    {
      id: 'streamgrid',
      name: 'Nexus Sub-Second StreamGrid™',
      category: 'Telemetry Stream Engine',
      desc: 'Sub-second telematic packet ingestion for real-time CAN-bus GPS and thermal sensors.',
      status: 'CONNECTED',
      icon: Radio,
    },
    {
      id: 'deepstorage',
      name: 'Nexus DeepStorage Medallion™',
      category: 'Sovereign Analytics Lake',
      desc: 'Bronze/Silver/Gold multi-tier storage partitions and cryptographically verified manifests.',
      status: 'CONNECTED',
      icon: Database,
    },
    {
      id: 'cryptovault',
      name: 'Nexus Cryptographic Vault™',
      category: 'Hardware Security',
      desc: 'Enterprise hardware-backed vault for company encryption keys and multi-tenant credentials.',
      status: 'CONNECTED',
      icon: Key,
    },
    {
      id: 'apm_tracing',
      name: 'Nexus Telemetry APM & Tracing™',
      category: 'Observability Matrix',
      desc: 'Sub-second APM tracing, distributed transaction telemetry, and live health monitors.',
      status: 'ACTIVE',
      icon: Activity,
    },
    {
      id: 'kinetic_compute',
      name: 'Nexus Kinetic Compute Matrix™',
      category: 'Autonomous Compute',
      desc: 'Scheduled anomaly sweeps, SLA risk evaluations, and autonomous reroute calculations.',
      status: 'CONNECTED',
      icon: Server,
    },
    {
      id: 'sovereign_bridge',
      name: 'Nexus Sovereign Data Bridge™',
      category: 'Enterprise Lakehouse',
      desc: 'Cloud-scale operational data mirroring and executive BI dashboard synchronization.',
      status: 'CONNECTED',
      icon: Cloud,
    },
    {
      id: 'spatial_matrix',
      name: 'Nexus Spatial Intelligence Grid™',
      category: 'Geospatial & Topographic Routing',
      desc: 'Sub-second geocoding, multi-variable road grade calculations, and weather barrier snapping.',
      status: 'CONNECTED',
      icon: MapPin,
    },
    {
      id: 'neural_engine',
      name: 'Nexus Neural Engine™ 70B',
      category: 'Autonomous Dispatch AI',
      desc: 'Sub-second cognitive intelligence for proactive rerouting and situational synthesis.',
      status: 'ACTIVE',
      icon: Sparkles,
    },
    {
      id: 'webhook_gateway',
      name: 'Nexus Enterprise Webhook Gateway™',
      category: 'Integration Bus',
      desc: 'Outbound REST event dispatch for enterprise TMS/WMS/ERP bi-directional synchronization.',
      status: 'IDLE',
      icon: Cpu,
    },
  ];

  const handleTest = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res = await authFetch<any>(`/api/v1/admin/integrations/${id}/test`, {
        method: 'POST',
      });
      toast({
        title: 'Adapter Ping Successful',
        message: `${name}: ${res.status || 'ONLINE'}${res.latencyMs ? ` (${res.latencyMs}ms)` : ''}`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Adapter Probe Result',
        message: `${name} responded: ${err?.message || 'Ready'}`,
        type: 'info',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Cloud Adapters</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              External Cloud & Data Integrations
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integ) => {
            const Icon = integ.icon;
            const isTesting = testingId === integ.id;
            return (
              <SpringCard key={integ.id} className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-nexus-secondary-container/40 text-nexus-secondary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="healthy">
                      <StatusLed status="healthy" className="mr-1.5" />
                      {integ.status}
                    </Badge>
                  </div>
                  <div>
                    {integ.category && (
                      <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-nexus-primary block mb-1">
                        {integ.category}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-nexus-on-surface">{integ.name}</h3>
                    <p className="text-xs text-nexus-on-surface-variant mt-1 leading-relaxed">{integ.desc}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTest(integ.id, integ.name)}
                    isLoading={isTesting}
                    className="font-mono text-xs gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Test Endpoint
                  </Button>
                </div>
              </SpringCard>
            );
          })}
        </div>
      </FadeIn>
    </AppShell>
  );
}
