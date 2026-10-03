'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useUser } from '@clerk/nextjs';

export default function AdminDashboard() {
  const { user } = useUser();
  const [overview, setOverview] = React.useState<any>(null);
  const [system, setSystem] = React.useState<any>(null);
  const [pipeline, setPipeline] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [ov, sys, pip] = await Promise.all([
          api.admin.getOverview(),
          api.admin.getSystemHealth(),
          api.admin.getPipeline(),
        ]);
        setOverview(ov);
        setSystem(sys);
        setPipeline(Array.isArray(pip) ? pip : []);
      } catch (err) {
        console.error('Failed to load admin dashboard data', err);
      }
    })();
  }, [user]);

  if (!overview || !system) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-6">
      {/* API Gateway health */}
      <Card>
        <CardHeader>
          <CardTitle>API Gateway</CardTitle>
          <CardDescription>{system.api?.status ?? 'UNKNOWN'}</CardDescription>
        </CardHeader>
        <Badge variant={system.api?.status === 'HEALTHY' ? 'healthy' : 'critical'}>
          {system.api?.status ?? 'N/A'}
        </Badge>
      </Card>

      {/* Functions queue depth */}
      <Card>
        <CardHeader>
          <CardTitle>Functions Queue</CardTitle>
          <CardDescription>{system.functions?.queueDepth ?? 'N/A'}</CardDescription>
        </CardHeader>
      </Card>

      {/* Blob storage usage */}
      <Card>
        <CardHeader>
          <CardTitle>Blob Storage</CardTitle>
          <CardDescription>{system.blob?.usageGb ?? 'N/A'} GB used</CardDescription>
        </CardHeader>
      </Card>

      {/* Key Vault secrets */}
      <Card>
        <CardHeader>
          <CardTitle>Key Vault</CardTitle>
          <CardDescription>{system.keyVault?.secretCount ?? 'N/A'} secrets</CardDescription>
        </CardHeader>
      </Card>

      {/* Pipeline health list */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Health</CardTitle>
          <CardDescription>{pipeline.length} pipelines</CardDescription>
        </CardHeader>
        <ul className="space-y-2 p-4">
          {pipeline.map(p => (
            <li key={p.id} className="flex justify-between items-center">
              <span>{p.source_name}</span>
              <Badge variant={p.status === 'HEALTHY' ? 'healthy' : 'critical'}>{p.status}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
