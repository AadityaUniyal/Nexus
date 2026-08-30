'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Key, Lock, Save, Sliders } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = React.useState('Continental Logistics North America');
  const [sessionTimeout, setSessionTimeout] = React.useState('12');
  const [requireMFA, setRequireMFA] = React.useState(true);
  const [auditRetention, setAuditRetention] = React.useState('365');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Platform Governance Updated',
      message: 'Workspace security and audit retention parameters saved.',
      type: 'success',
    });
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>Workspace Governance</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Platform Security & Workspace Settings
            </h1>
          </div>
        </div>

        <SpringCard className="p-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Workspace Identity
              </h3>
              <Input
                label="Workspace Legal Entity"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>

            <div className="space-y-4 border-t border-nexus-surface-container-high pt-6">
              <h3 className="text-sm font-mono uppercase font-bold text-nexus-secondary">
                Security & Session Policies
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                    Session Inactivity Timeout (Hours)
                  </label>
                  <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                    Audit Log Retention (Days)
                  </label>
                  <Input
                    type="number"
                    value={auditRetention}
                    onChange={(e) => setAuditRetention(e.target.value)}
                  />
                </div>
              </div>

              <label className="p-4 rounded-xl border border-nexus-surface-container-high bg-nexus-surface-container/30 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-bold">Enforce Hardware FIDO2 MFA</span>
                  <p className="text-xs text-nexus-on-surface-variant">Required for all Operations Managers and Administrators</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireMFA}
                  onChange={(e) => setRequireMFA(e.target.checked)}
                  className="h-4 w-4 text-nexus-secondary focus:ring-nexus-secondary"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" className="gap-2">
                <Save className="h-4 w-4" /> Save Configuration
              </Button>
            </div>
          </form>
        </SpringCard>
      </FadeIn>
    </AppShell>
  );
}
