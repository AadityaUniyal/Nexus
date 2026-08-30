'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, UserCheck, BarChart3, Navigation } from 'lucide-react';
import { FadeIn } from '@/components/motion';

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState('OPERATIONS_MANAGER');

  const roles = [
    {
      id: 'OPERATIONS_MANAGER',
      name: 'Operations Manager',
      desc: 'Full operational command, live reroute approvals, and simulation decision execution.',
      icon: ShieldCheck,
    },
    {
      id: 'ADMINISTRATOR',
      name: 'Platform Administrator',
      desc: 'System health monitoring, user provisioning, pipeline diagnostics, and audit logs.',
      icon: UserCheck,
    },
    {
      id: 'ANALYST',
      name: 'Operations Analyst',
      desc: 'Deep SLA telemetry analytics, trend forecasting, and executive reporting.',
      icon: BarChart3,
    },
    {
      id: 'OPERATOR',
      name: 'Field Dispatch Operator',
      desc: 'Real-time vehicle monitoring, incident triage, and route status updates.',
      icon: Navigation,
    },
  ];

  const handleNext = () => {
    router.push('/alert-rules');
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-nexus-on-surface-variant px-2">
          <span>ONBOARDING · STEP 4 OF 5</span>
          <span>ROLE & PERMISSIONS</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood="WELCOME" size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>Select Your Primary Operational Role</CardTitle>
            <CardDescription>
              Customizes your default landing dashboard, command shortcuts, and RBAC authorization tokens.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'border-nexus-secondary bg-nexus-secondary/5 shadow-tactile'
                      : 'border-nexus-surface-container-high bg-white/60 hover:bg-nexus-surface-container/50'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-nexus-secondary text-white'
                        : 'bg-nexus-surface-container text-nexus-on-surface-variant'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-nexus-on-surface">{r.name}</h4>
                    <p className="text-xs text-nexus-on-surface-variant leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>

          <CardFooter className="flex justify-between items-center pt-2">
            <Link href="/environment" className="text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
              Back
            </Link>
            <Button onClick={handleNext} variant="primary" className="font-mono text-xs gap-1">
              Continue to Alert Rules <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardFooter>
        </Card>
      </FadeIn>
    </div>
  );
}
