'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminNotificationRulesPage() {
  const rules = [
    {
      id: 'rule-1',
      event: 'incident.critical_detected',
      target: 'OPERATIONS_MANAGERS',
      channels: ['SSE_TOAST', 'PERSISTENT_NOTIFICATION', 'SMS_FALLBACK'],
      enabled: true,
    },
    {
      id: 'rule-2',
      event: 'simulation.decision_ready',
      target: 'ACTOR_AND_MANAGERS',
      channels: ['SSE_TOAST', 'NOTIFICATION_CENTER'],
      enabled: true,
    },
    {
      id: 'rule-3',
      event: 'pipeline.latency_warning',
      target: 'ADMINISTRATORS',
      channels: ['NOTIFICATION_CENTER', 'EMAIL_DIGEST'],
      enabled: true,
    },
  ];

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Alert Routing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              System Notification & Alert Routing Rules
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          {rules.map((r) => (
            <SpringCard key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-nexus-secondary" />
                  <span className="font-mono font-bold text-xs text-nexus-primary">{r.event}</span>
                </div>
                <p className="text-xs text-nexus-on-surface-variant">Dispatched to: {r.target}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  {r.channels.map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded bg-nexus-surface-container text-[10px] font-mono">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={r.enabled ? 'healthy' : 'neutral'}>
                  {r.enabled ? 'ACTIVE' : 'DISABLED'}
                </Badge>
              </div>
            </SpringCard>
          ))}
        </div>
      </FadeIn>
    </AppShell>
  );
}
