'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Bell, ShieldAlert, Radio } from 'lucide-react';
import { FadeIn } from '@/components/motion';

export default function OnboardingAlertRulesPage() {
  const router = useRouter();
  const [criticalPush, setCriticalPush] = React.useState(true);
  const [simulationAlerts, setSimulationAlerts] = React.useState(true);
  const [digestEmail, setDigestEmail] = React.useState(true);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/complete');
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-nexus-on-surface-variant px-2">
          <span>ONBOARDING · STEP 5 OF 5</span>
          <span>NOTIFICATION & ALERT RULES</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood="WELCOME" size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>Configure Notification Dispatch</CardTitle>
            <CardDescription>
              Control alert thresholds and real-time streaming preferences for your profile.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleNext}>
            <CardContent className="space-y-4">
              <label className="p-4 rounded-xl border border-nexus-surface-container-high bg-white/70 flex items-center justify-between cursor-pointer hover:bg-nexus-surface-container/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-nexus-on-surface">Critical Operational Alerts</span>
                  <p className="text-xs text-nexus-on-surface-variant">Immediate SSE toasts for route blocks and SLA breaches</p>
                </div>
                <input
                  type="checkbox"
                  checked={criticalPush}
                  onChange={(e) => setCriticalPush(e.target.checked)}
                  className="h-4 w-4 rounded text-nexus-secondary focus:ring-nexus-secondary"
                />
              </label>

              <label className="p-4 rounded-xl border border-nexus-surface-container-high bg-white/70 flex items-center justify-between cursor-pointer hover:bg-nexus-surface-container/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-nexus-on-surface">Simulation Decision Notifications</span>
                  <p className="text-xs text-nexus-on-surface-variant">Alert when what-if scenarios complete execution</p>
                </div>
                <input
                  type="checkbox"
                  checked={simulationAlerts}
                  onChange={(e) => setSimulationAlerts(e.target.checked)}
                  className="h-4 w-4 rounded text-nexus-secondary focus:ring-nexus-secondary"
                />
              </label>

              <label className="p-4 rounded-xl border border-nexus-surface-container-high bg-white/70 flex items-center justify-between cursor-pointer hover:bg-nexus-surface-container/40 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-nexus-on-surface">Daily Operational Digest</span>
                  <p className="text-xs text-nexus-on-surface-variant">Automated daily summary of fleet uptime and throughput</p>
                </div>
                <input
                  type="checkbox"
                  checked={digestEmail}
                  onChange={(e) => setDigestEmail(e.target.checked)}
                  className="h-4 w-4 rounded text-nexus-secondary focus:ring-nexus-secondary"
                />
              </label>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-2">
              <Link href="/role" className="text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
                Back
              </Link>
              <Button type="submit" variant="primary" className="font-mono text-xs gap-1">
                Finalize & Provision Hub <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
