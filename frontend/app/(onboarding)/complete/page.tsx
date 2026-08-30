'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Globe2, Sparkles } from 'lucide-react';
import { FadeIn } from '@/components/motion';

export default function OnboardingCompletePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <FadeIn className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-nexus-on-surface-variant px-2">
          <span>ONBOARDING · COMPLETE</span>
          <span>SYSTEMS SYNCHRONIZED</span>
        </div>

        <div className="flex justify-center -mb-2">
          <Avatar3D mood="SUCCESS" size="hero" />
        </div>

        <Card className="shadow-tactile-lg text-center">
          <CardHeader>
            <div className="mx-auto flex justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <CardTitle>Operational Workspace Ready</CardTitle>
            <CardDescription>
              Your multi-tenant spatial twin, deterministic simulation engine, and live telemetry feeds have been provisioned.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-nexus-secondary-container/20 border border-nexus-secondary/30 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-nexus-on-surface-variant">Active Assets Initialized:</span>
                <span className="font-bold text-nexus-on-surface">30 Vehicles · 5 Hubs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nexus-on-surface-variant">Live Corridors Synced:</span>
                <span className="font-bold text-nexus-on-surface">15 Intermodal Routes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nexus-on-surface-variant">Telemetry Pipeline:</span>
                <span className="font-bold text-emerald-600">CONNECTED (1.2 ms)</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Link href="/overview" className="w-full">
              <Button variant="primary" className="w-full font-mono text-xs gap-2 py-6">
                Enter Command Briefing Center <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/live-world" className="w-full">
              <Button variant="secondary" className="w-full font-mono text-xs gap-2">
                Open 3D Live World <Globe2 className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </FadeIn>
    </div>
  );
}
