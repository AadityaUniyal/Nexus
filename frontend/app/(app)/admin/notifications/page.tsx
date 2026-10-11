'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, ToggleLeft, ToggleRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FadeIn, SpringCard } from '@/components/motion';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';

interface NotificationRule {
  id: string;
  event: string;
  target: string;
  channels: string[];
  enabled: boolean;
}

export default function AdminNotificationRulesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const [rules, setRules] = React.useState<NotificationRule[]>([
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
    {
      id: 'rule-4',
      event: 'driver.proof_of_delivery_received',
      target: 'DISPATCH_OPERATORS',
      channels: ['SSE_TOAST', 'AUDIT_FEED'],
      enabled: true,
    },
  ]);

  const fetchRules = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/notifications/rules');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRules(data);
        }
      }
    } catch {
      // Retain fallback rules
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggleRule = async (ruleId: string) => {
    try {
      setTogglingId(ruleId);
      tactileAudio.playClick();
      const res = await fetch(`/api/v1/notifications/rules/${ruleId}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const result = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled: result.rule.enabled } : r))
        );
        tactileAudio.playSuccess();
        toast({
          title: 'Rule Status Updated',
          message: `Rule ${ruleId} is now ${result.rule.enabled ? 'ACTIVE' : 'DISABLED'}`,
          type: 'success',
        });
      } else {
        throw new Error('Failed to toggle rule');
      }
    } catch {
      // Local optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
      );
      toast({
        title: 'Rule Toggled (Offline)',
        message: 'Rule status updated in local buffer.',
        type: 'info',
      });
    } finally {
      setTogglingId(null);
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
              <span>Alert Routing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              System Notification & Alert Routing Rules
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRules}
            disabled={loading}
            className="self-start md:self-auto font-mono text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Rules</span>
          </Button>
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
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {r.channels.map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded bg-nexus-surface-container text-[10px] font-mono text-nexus-on-surface-variant border border-nexus-outline/20">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={r.enabled ? 'healthy' : 'neutral'}>
                  {r.enabled ? 'ACTIVE' : 'DISABLED'}
                </Badge>
                <Button
                  variant={r.enabled ? 'danger' : 'secondary'}
                  size="sm"
                  disabled={togglingId === r.id}
                  onClick={() => handleToggleRule(r.id)}
                  className="font-mono text-xs"
                >
                  {r.enabled ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </SpringCard>
          ))}
        </div>
      </FadeIn>
    </AppShell>
  );
}
