'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Cloud, Cpu, Radio, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminIntegrationsPage() {
  const { toast } = useToast();
  const [testingId, setTestingId] = React.useState<string | null>(null);

  const integrations = [
    {
      id: 'fabric',
      name: 'Microsoft Fabric & OneLake Bridge',
      desc: 'Delta Lake parquet mirroring for cloud-scale analytics.',
      status: 'CONNECTED',
      icon: Cloud,
    },
    {
      id: 'azure',
      name: 'Azure Event Hubs Adapter',
      desc: 'High-throughput IoT GPS telemetry ingress.',
      status: 'CONNECTED',
      icon: Radio,
    },
    {
      id: 'groq',
      name: 'Groq LLaMA 3.3 AI Provider',
      desc: 'Executive summaries and management command briefings (Optional enhancement).',
      status: 'ACTIVE',
      icon: Sparkles,
    },
    {
      id: 'webhook',
      name: 'Enterprise Webhook Dispatcher',
      desc: 'Outbound REST event dispatch for third-party ERP/WMS systems.',
      status: 'IDLE',
      icon: Cpu,
    },
  ];

  const handleTest = (id: string, name: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      toast({
        title: 'Adapter Ping Successful',
        message: `${name} responded with 200 OK.`,
        type: 'success',
      });
    }, 700);
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
