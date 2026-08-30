'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tactileAudio } from '@/lib/sound-effects';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [userRole, setUserRole] = React.useState<string>('ADMINISTRATOR');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_user');
        if (stored) {
          const u = JSON.parse(stored);
          const role = u.role || 'OPERATIONS_MANAGER';
          setUserRole(role);
          if (role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            tactileAudio.playCriticalAlert();
          }
        } else {
          // Default to true for development demo view unless explicitly set
          setIsAdmin(true);
        }
      } catch {
        setIsAdmin(true);
      }
    }
  }, []);

  if (isAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-center text-red-600 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>
        <span className="text-xs font-mono font-bold tracking-widest text-red-600 dark:text-red-400 uppercase">
          RBAC Security Clearance Gated
        </span>
        <h2 className="text-2xl font-bold text-nexus-on-surface mt-2">
          Administrator Privileges Required
        </h2>
        <p className="text-sm text-nexus-on-surface-variant max-w-md mt-2 font-mono leading-relaxed">
          Your current session role (<span className="text-red-500 font-bold">{userRole}</span>) does not have clearance to inspect platform pipeline topology, modify RBAC roles, or view immutable audit logs.
        </p>

        <div className="flex items-center gap-3 mt-6">
          <Link href="/overview">
            <Button variant="secondary" className="font-mono text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Command Hub
            </Button>
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              // Elevate demo session to administrator
              localStorage.setItem(
                'nexus_user',
                JSON.stringify({
                  id: 'usr-adm-1',
                  name: 'Marcus Vance',
                  role: 'ADMINISTRATOR',
                  email: 'admin@nexus.ops',
                  department: 'Platform Governance & Security',
                })
              );
              setIsAdmin(true);
              tactileAudio.playSuccessChord();
            }}
            className="font-mono text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
          >
            <Key className="w-3.5 h-3.5" /> Switch to Admin Credential
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
