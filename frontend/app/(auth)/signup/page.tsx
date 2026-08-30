'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D, AvatarMood } from '@/components/avatar/Avatar3D';
import { NexusHero3D } from '@/components/brand/NexusHero3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Building2, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [organization, setOrganization] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarMood, setAvatarMood] = React.useState<AvatarMood>('WELCOME');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      setAvatarMood('ERROR');
      tactileAudio.playCriticalAlert();
      toast({
        title: 'Validation Error',
        message: 'Master security passphrase must be at least 6 characters.',
        type: 'critical',
      });
      return;
    }

    setIsLoading(true);
    setAvatarMood('LOADING');
    tactileAudio.playClick();

    // Store new user in local state
    const newUser = {
      id: `usr-org-${Date.now().toString().slice(-4)}`,
      name: name || 'Enterprise Lead',
      email: email || 'lead@enterprise.ops',
      role: 'OPERATIONS_MANAGER',
      department: organization || 'Autonomous Logistics Network',
      workspace_id: `ws-${Date.now().toString().slice(-4)}`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_user', JSON.stringify(newUser));
      localStorage.setItem('nexus_auth_token', 'nxtok_' + Date.now());
    }

    setTimeout(() => {
      setIsLoading(false);
      setAvatarMood('SUCCESS');
      tactileAudio.playSuccessChord();
      toast({
        title: 'Workspace Provisioned',
        message: 'Welcome to NEXUS! Proceeding to dynamic regional setup.',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/welcome');
      }, 600);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-nexus-primary-container flex items-center justify-center text-white shadow-tactile group-hover:scale-105 transition-transform">
            <span className="font-bold text-sm tracking-tighter">NX</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">NEXUS</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Workspace Provisioning
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span>Already authorized?</span>
          <Link href="/login">
            <Button variant="secondary" size="sm" className="font-mono-data text-xs">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Split-Screen 3D Workspace Builder */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-12 items-center">
        {/* Left Side: 3D Network Hologram & Enterprise Value Props */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile w-fit">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-mono-data text-nexus-on-surface font-semibold">
              MULTI-TENANT SPATIAL SIMULATION ENGINE
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-nexus-on-surface tracking-tight leading-tight">
            Deploy an autonomous logistics matrix.
          </h1>

          <p className="text-sm md:text-base text-nexus-on-surface-variant leading-relaxed max-w-lg">
            Instantly spin up a dedicated multi-hub logistics partition with custom aerodynamics, live weather hazard ingestion, and automated root cause analysis.
          </p>

          {/* Interactive 3D Canvas */}
          <div className="relative h-64 sm:h-80 w-full rounded-3xl bg-nexus-surface-lowest/80 backdrop-blur-xl border border-nexus-outline-variant/40 shadow-tactile-lg overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0">
              <NexusHero3D currentStep={3} interactive={true} />
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10 bg-nexus-surface-lowest/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-nexus-outline-variant/30 text-[11px] font-mono-data text-nexus-on-surface-variant">
              <span>Simulation Partition: Ready</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">ACID Isolated</span>
            </div>
          </div>
        </div>

        {/* Right Side: Provisioning Card */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-md space-y-6">
            <div className="flex justify-center -mb-2">
              <div className="p-3 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile">
                <Avatar3D mood={avatarMood} size="lg" />
              </div>
            </div>

            <Card className="shadow-tactile-lg border-2 border-nexus-outline-variant/50">
              <CardHeader>
                <div>
                  <CardTitle className="text-xl">Create Operational Workspace</CardTitle>
                  <CardDescription>
                    Provision a dedicated multi-tenant logistics environment with deterministic simulation.
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Input
                    label="Full Operator Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                  />

                  <Input
                    label="Corporate Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.morgan@logistics.ops"
                  />

                  <Input
                    label="Workspace / Enterprise Name"
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Northwest Regional Logistics"
                  />

                  <Input
                    label="Master Security Passphrase"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                  />

                  <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full font-mono-data text-xs shadow-tactile" isLoading={isLoading}>
                      Provision Workspace & Launch
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </form>

              <CardFooter className="flex flex-col gap-2 pt-0">
                <div className="text-center text-xs text-nexus-on-surface-variant font-mono-data">
                  Already have an authorized profile?{' '}
                  <Link href="/login" className="text-nexus-secondary font-bold hover:underline">
                    Sign In here
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
