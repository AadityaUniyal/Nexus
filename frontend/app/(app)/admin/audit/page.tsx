'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ShieldCheck, Search } from 'lucide-react';
import { AuditLogItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';

export default function AdminAuditPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    dataProvider.getAuditLogs()
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .catch((err) => {
        console.error("Failed to fetch audit logs:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Compliance & Security</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Immutable System Audit Logs
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> APPEND-ONLY LEDGER
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <input
              placeholder="Search audit action, operator, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-9 text-xs rounded-lg border border-nexus-outline-variant bg-nexus-surface focus:outline-none"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action Code</TableHead>
              <TableHead>Actor Operator</TableHead>
              <TableHead>Entity Affected</TableHead>
              <TableHead>Audit Mutation Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  {log.action}
                </TableCell>
                <TableCell className="text-xs font-medium text-nexus-secondary">
                  {log.actorName}
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">
                  {log.entityType ? `${log.entityType}:${log.entityId}` : 'SYSTEM'}
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant max-w-md">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
