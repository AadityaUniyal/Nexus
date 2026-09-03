'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Radio } from 'lucide-react';
import { OperationalEventItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

export default function EventsStreamPage() {
  const [search, setSearch] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('ALL');
  const [events, setEvents] = React.useState<OperationalEventItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    dataProvider.getEvents()
      .then((data) => {
        if (mounted) setEvents(data);
      })
      .catch((err) => {
        console.error("Failed to fetch events stream:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch =
      e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      e.entityId.toLowerCase().includes(search.toLowerCase()) ||
      e.entityType.toLowerCase().includes(search.toLowerCase()) ||
      e.message.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'ALL' || e.severity === severityFilter;
    return matchSearch && matchSev;
  });

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/intelligence" className="hover:underline">Intelligence</Link>
              <span>·</span>
              <span>Event Stream</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Operational Telemetry Event Stream
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SSE STREAM ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search event type, entity ID, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-xs focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Alerts</option>
              <option value="WARNING">Warnings</option>
              <option value="INFO">Informational</option>
            </select>
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
            {filtered.map((evt) => (
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
