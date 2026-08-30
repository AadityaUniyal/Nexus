'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';
import { INITIAL_EVENTS, OperationalEventItem } from '@/lib/mock-data';
import { formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

export default function AdminEventsPage() {
  const [events] = React.useState<OperationalEventItem[]>(INITIAL_EVENTS);

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Event Audit Stream</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              System-Wide Operational Event Ledger
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1.5">
              <Radio className="h-4 w-4 animate-pulse" /> 100% PERSISTED
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Occurred Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Event Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((evt) => (
              <TableRow key={evt.id}>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {formatDateTime(evt.occurredAt)}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  {evt.eventType}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-nexus-secondary">{evt.entityType}</span>:{evt.entityId}
                </TableCell>
                <TableCell>
                  <Badge variant={evt.severity === 'CRITICAL' ? 'critical' : evt.severity === 'WARNING' ? 'attention' : 'healthy'}>
                    {evt.severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant max-w-md truncate">
                  {evt.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
