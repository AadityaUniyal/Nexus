'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SimulationItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

export default function AdminSimulationsPage() {
  const [sims, setSims] = React.useState<SimulationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    dataProvider.getSimulations()
      .then((data) => {
        if (mounted) setSims(data);
      })
      .catch((err) => {
        console.error("Failed to fetch simulations:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Simulation Oversight</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Simulation Batch Runs & Applied Decisions
            </h1>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Simulation Code</TableHead>
              <TableHead>Scenario Title</TableHead>
              <TableHead>Base Incident</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Execution Delay Delta</TableHead>
              <TableHead>Decision Applied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sims.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-lavender-dark">
                  <Link href={`/simulations/${s.id}`} className="hover:underline flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-nexus-lavender-dark" />
                    {s.code}
                  </Link>
                </TableCell>
                <TableCell className="text-xs font-medium">{s.title}</TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {s.incidentId || 'General Stress Test'}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === 'APPLIED' ? 'healthy' : 'simulation'}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-emerald-600 font-bold">
                  {s.simulatedMetrics?.netTimeSavedMins ? `${s.simulatedMetrics.netTimeSavedMins} min saved` : 'N/A'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {s.appliedAt ? formatDateTime(s.appliedAt) : 'Pending Review'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/simulations/${s.id}`}>
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
