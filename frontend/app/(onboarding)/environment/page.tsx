'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Server, Database, Cloud } from 'lucide-react';
import { FadeIn } from '@/components/motion';

export default function OnboardingEnvironmentPage() {
  const router = useRouter();
  const [telemetryRate, setTelemetryRate] = React.useState('1hz');
  const [simulationEngine, setSimulationEngine] = React.useState('DETERMINISTIC');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/role');
  };

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-nexus-on-surface-variant px-2">
          <span>ONBOARDING · STEP 3 OF 5</span>
          <span>ENVIRONMENT & TELEMETRY</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood="LOADING" size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>Telemetry & Simulation Settings</CardTitle>
            <CardDescription>
              Configure the data streaming ingestion rate and deterministic scenario rules.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleNext}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                  Telemetry Ingestion Frequency
                </label>
                <select
                  value={telemetryRate}
                  onChange={(e) => setTelemetryRate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                >
                  <option value="1hz">High Frequency (1 Hz / Sub-second GPS)</option>
                  <option value="5s">Standard Fleet (5s Interval)</option>
                  <option value="30s">Battery-Optimized (30s Polling)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                  Simulation Engine Architecture
                </label>
                <select
                  value={simulationEngine}
                  onChange={(e) => setSimulationEngine(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                >
                  <option value="DETERMINISTIC">Pure Deterministic (Isolated Sandbox, ACID Apply)</option>
                  <option value="STOCHASTIC">Stochastic Risk (Monte Carlo SLA Variance)</option>
                </select>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-2">
              <Link href="/workspace" className="text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
                Back
              </Link>
              <Button type="submit" variant="primary" className="font-mono text-xs gap-1">
                Continue to Role Assignment <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
}
