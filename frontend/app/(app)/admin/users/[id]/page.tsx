'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import {
  ArrowLeft,
  Users,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserItem, AuditLogItem } from '@/lib/mock-data';
import { dataProvider } from '@/lib/data-provider';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;

  const [user, setUser] = React.useState<UserItem | null>(null);
  const [role, setRole] = React.useState<string>('OPERATOR');
  const [userAudit, setUserAudit] = React.useState<AuditLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      dataProvider.getUser(userId),
      dataProvider.getAuditLogs(),
    ])
      .then(([u, logs]) => {
        if (mounted) {
          setUser(u);
          if (u) {
            setRole(u.role);
            setUserAudit(logs.filter((a) => a.actorName === u.name || a.entityId === u.id));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user details:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const updated = await dataProvider.updateUserRole(user.id, role);
      setUser(updated);
      toast({
        title: 'Security Clearance Updated',
        message: `Assigned new role ${role} to ${user.name}.`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        message: err?.message || 'Could not update user role.',
        type: 'critical',
      });
    }
  };

  const toggleStatus = () => {
    if (!user) return;
    setUser({ ...user, active: !user.active });
    toast({
      title: user.active ? 'Account Suspended' : 'Account Reactivated',
      message: `${user.name} credentials ${user.active ? 'revoked' : 'restored'}.`,
      type: user.active ? 'warning' : 'success',
    });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 font-mono text-sm text-nexus-on-surface-variant">
          Loading user security clearance...
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="p-8 space-y-4 font-mono text-sm">
          <p className="text-nexus-on-surface">User '{userId}' was not found.</p>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> Back to User Directory
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to User Directory
              </Button>
            </Link>
            <div className="h-4 w-px bg-nexus-outline-variant/30" />
            <h1 className="text-xl font-bold font-mono text-nexus-on-surface">
              {user.name} ({user.email})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={user.active ? 'danger' : 'primary'}
              size="sm"
              onClick={toggleStatus}
              className="font-mono text-xs"
            >
              {user.active ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                RBAC Role Assignment & Clearance
              </h3>

              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-nexus-on-surface-variant uppercase font-medium">Assigned System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none"
                  >
                    <option value="ADMINISTRATOR">Administrator (Full Access)</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager (Dispatch & Sim)</option>
                    <option value="ANALYST">Analyst (Telemetry & Reports)</option>
                    <option value="OPERATOR">Operator (Field Monitor)</option>
                    <option value="VIEWER">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="sm" onClick={handleSave}>
                    Save Clearance Changes
                  </Button>
                </div>
              </div>
            </SpringCard>

            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                User Activity & Audit Records ({userAudit.length})
              </h3>
              {userAudit.length === 0 ? (
                <p className="text-xs text-nexus-on-surface-variant">No security-audited mutations logged for this operator.</p>
              ) : (
                <div className="space-y-2">
                  {userAudit.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border border-nexus-surface-container-high flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-nexus-primary">{log.action}</span>
                        <p className="text-nexus-on-surface-variant">{log.details}</p>
                      </div>
                      <span className="text-nexus-on-surface-variant">{log.createdAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </SpringCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SpringCard className="p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Security Profile
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>MFA Token:</span>
                  <span className="text-emerald-600 font-bold">ENFORCED (FIDO2)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>Session Expiry:</span>
                  <span>12 Hours</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-nexus-surface-container">
                  <span>Workspace:</span>
                  <span>Continental Fleet</span>
                </div>
              </div>
            </SpringCard>
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
