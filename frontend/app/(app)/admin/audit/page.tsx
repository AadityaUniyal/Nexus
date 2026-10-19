'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ShieldCheck, Search, Download, Filter, Lock, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditLogItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { formatDateTime } from '@/lib/utils';
import { FadeIn } from '@/components/motion';
import { exportToCsv } from '@/lib/csv-export';

export default function AdminAuditPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('ALL');
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null);

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

  const handleExport = () => {
    const exportData = logs.map((l) => ({
      Timestamp: l.createdAt,
      Action: l.action,
      Actor: l.actorName,
      EntityType: l.entityType || 'SYSTEM',
      EntityId: l.entityId || 'N/A',
      Details: l.details,
    }));
    exportToCsv('nexus_compliance_audit_ledger.csv', exportData);
  };

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

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

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" /> APPEND-ONLY LEDGER
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs font-mono"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Audit CSV
            </Button>
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-xs font-mono focus:outline-none"
            >
              <option value="ALL">All Actions ({logs.length})</option>
              <option value="LOGIN">Auth & Sessions</option>
              <option value="SIMULATION">Simulations</option>
              <option value="DECISION">Decisions</option>
              <option value="INCIDENT">Incidents</option>
              <option value="VEHICLE">Fleet Operations</option>
            </select>
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
              <TableHead className="text-right">Integrity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="cursor-pointer hover:bg-stone-50/80 dark:hover:bg-stone-900/60 transition-colors"
              >
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
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant max-w-md truncate">
                  {log.details}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Lock className="w-2.5 h-2.5" /> RECORDED
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Selected Log Inspector Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold font-mono text-stone-900 dark:text-white">
                    Audit Event #{selectedLog.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-stone-500">Action:</span>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-stone-500">Actor Operator:</span>
                  <p className="text-stone-800 dark:text-stone-200 mt-0.5">{selectedLog.actorName}</p>
                </div>
                <div>
                  <span className="text-stone-500">Affected Entity:</span>
                  <p className="text-stone-800 dark:text-stone-200 mt-0.5">
                    {selectedLog.entityType || 'SYSTEM'} · {selectedLog.entityId || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Timestamp:</span>
                  <p className="text-stone-800 dark:text-stone-200 mt-0.5">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500 block mb-1">Audit Details / Payload:</span>
                  <p className="whitespace-pre-wrap break-all text-stone-700 dark:text-stone-300">
                    {selectedLog.details}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>This event was returned by the workspace audit API. This view does not certify tamper-proof storage or regulatory compliance.</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </FadeIn>
    </AppShell>
  );
}

