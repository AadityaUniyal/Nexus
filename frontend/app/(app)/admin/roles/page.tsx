'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FadeIn, SpringCard } from '@/components/motion';

export default function AdminRolesPage() {
  const { toast } = useToast();

  const permissionsList = [
    { key: 'VIEW_OPERATIONS', label: 'View Live Operational Telemetry' },
    { key: 'EDIT_OPERATIONS', label: 'Modify Asset & Route Metadata' },
    { key: 'RUN_SIMULATION', label: 'Launch Sandboxed What-If Simulations' },
    { key: 'APPLY_DECISION', label: 'Apply Transactional Decisions to Live Fleet' },
    { key: 'VIEW_ANALYTICS', label: 'View SLA & Telemetry Analytics' },
    { key: 'VIEW_AUDIT', label: 'Inspect Immutable Audit Trails' },
    { key: 'MANAGE_USERS', label: 'Provision Users & Security Tokens' },
    { key: 'MANAGE_INTEGRATIONS', label: 'Configure Azure & Microsoft Fabric Adapters' },
  ];

  const roleMatrices = [
    {
      role: 'ADMINISTRATOR',
      title: 'Platform Administrator',
      perms: ['VIEW_OPERATIONS', 'EDIT_OPERATIONS', 'RUN_SIMULATION', 'APPLY_DECISION', 'VIEW_ANALYTICS', 'VIEW_AUDIT', 'MANAGE_USERS', 'MANAGE_INTEGRATIONS'],
    },
    {
      role: 'OPERATIONS_MANAGER',
      title: 'Operations Manager',
      perms: ['VIEW_OPERATIONS', 'EDIT_OPERATIONS', 'RUN_SIMULATION', 'APPLY_DECISION', 'VIEW_ANALYTICS', 'VIEW_AUDIT'],
    },
    {
      role: 'ANALYST',
      title: 'Operations Analyst',
      perms: ['VIEW_OPERATIONS', 'RUN_SIMULATION', 'VIEW_ANALYTICS', 'VIEW_AUDIT'],
    },
    {
      role: 'OPERATOR',
      title: 'Field Dispatch Operator',
      perms: ['VIEW_OPERATIONS', 'EDIT_OPERATIONS'],
    },
    {
      role: 'VIEWER',
      title: 'Auditor / Viewer',
      perms: ['VIEW_OPERATIONS', 'VIEW_ANALYTICS'],
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
              <span>RBAC Matrix</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Role-Based Access Control (RBAC) Permissions
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {roleMatrices.map((rm) => (
            <SpringCard key={rm.role} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-nexus-surface-container-high pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-nexus-secondary" />
                    <span className="font-mono font-bold text-sm text-nexus-primary">{rm.role}</span>
                  </div>
                  <p className="text-xs text-nexus-on-surface-variant">{rm.title}</p>
                </div>
                <Badge variant="healthy">{rm.perms.length} Permissions Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {permissionsList.map((p) => {
                  const hasPerm = rm.perms.includes(p.key);
                  return (
                    <div
                      key={p.key}
                      className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                        hasPerm
                          ? 'border-nexus-secondary/30 bg-nexus-secondary/5 text-nexus-on-surface'
                          : 'border-nexus-surface-container-high bg-nexus-surface-container/20 text-nexus-on-surface-variant opacity-60'
                      }`}
                    >
                      {hasPerm ? (
                        <CheckCircle2 className="h-4 w-4 text-nexus-secondary shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-nexus-outline shrink-0" />
                      )}
                      <span className="font-mono text-[11px]">{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </SpringCard>
          ))}
        </div>
      </FadeIn>
    </AppShell>
  );
}
