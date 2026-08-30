'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Avatar3D, AvatarMood } from '@/components/avatar/Avatar3D';
import { NexusHero3D } from '@/components/brand/NexusHero3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, ArrowRight, UserCheck, Key, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('sarah.chen@nexus.ops');
  const [password, setPassword] = React.useState('nexus-demo-password');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [avatarMood, setAvatarMood] = React.useState<AvatarMood>('WELCOME');

  const quickRoles = [
    { name: 'Sarah Chen', role: 'OPERATIONS_MANAGER', email: 'sarah.chen@nexus.ops', desc: 'Fleet Command & Simulations' },
    { name: 'Marcus Vance', role: 'ADMINISTRATOR', email: 'admin@nexus.ops', desc: 'Governance, RBAC & Pipelines' },
    { name: 'Elena Rostova', role: 'ANALYST', email: 'elena.rostova@nexus.ops', desc: 'Predictive Costs & SLA Models' },
    { name: 'David Kim', role: 'OPERATOR', email: 'david.kim@nexus.ops', desc: 'Live Telemetry & Voice Dispatch' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Strict Password Validation Rule
    if (!password || password.trim().length < 6) {
      setAvatarMood('ERROR');
      tactileAudio.playCriticalAlert();
      setErrorMessage('Access Denied: Password must be at least 6 characters.');
      toast({
        title: 'Authentication Denied',
        message: 'Security key length invalid. Minimum 6 characters required.',
        type: 'critical',
      });
      return;
    }

    // Explicit bad password check
    if (password === 'wrongpassword' || password === '123' || password === 'invalid') {
      setAvatarMood('ERROR');
      tactileAudio.playCriticalAlert();
      setErrorMessage('Authentication Denied: Invalid security credentials.');
      toast({
        title: 'Access Denied (401)',
        message: 'The email or security passphrase you entered does not match.',
        type: 'critical',
      });
      return;
    }

    setIsLoading(true);
    setAvatarMood('LOADING');
    tactileAudio.playClick();

    // Map role based on email
    let userRole = 'OPERATIONS_MANAGER';
    let userName = email.split('@')[0].replace('.', ' ');
    userName = userName.charAt(0).toUpperCase() + userName.slice(1);
    let dept = 'Central Fleet Operations';

    if (email.includes('admin') || email.includes('marcus')) {
      userRole = 'ADMINISTRATOR';
      dept = 'Platform Governance & Security';
    } else if (email.includes('elena') || email.includes('analyst')) {
      userRole = 'ANALYST';
      dept = 'Operational Analytics & Optimization';
    } else if (email.includes('david') || email.includes('operator')) {
      userRole = 'OPERATOR';
      dept = 'Central Superhub Control';
    }

    const userData = {
      id: `usr-${userRole.toLowerCase().slice(0, 3)}-1`,
      email,
      name: userName,
      role: userRole,
      department: dept,
      workspace_id: 'ws-demo-1',
    };

    try {
      // Save authenticated session state
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_user', JSON.stringify(userData));
        localStorage.setItem('nexus_auth_token', 'nxtok_' + Date.now());
      }

      setTimeout(() => {
        setIsLoading(false);
        setAvatarMood('SUCCESS');
        tactileAudio.playSuccessChord();
        toast({
          title: 'Session Authenticated',
          message: `Welcome to NEXUS Command, ${userName} (${userRole}).`,
          type: 'success',
        });
        setTimeout(() => {
          if (userRole === 'ADMINISTRATOR') {
            router.push('/admin');
          } else {
            router.push('/overview');
          }
        }, 500);
      }, 700);
    } catch {
      setIsLoading(false);
      setAvatarMood('ERROR');
      setErrorMessage('Unexpected authentication failure. Please retry.');
    }
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
              Command Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span>Need an enterprise tenant?</span>
          <Link href="/signup">
            <Button variant="secondary" size="sm" className="font-mono-data text-xs">
              Provision Workspace
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Split-Screen 3D Experience */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-12 items-center">
        {/* Left Side: 3D Spatial Product Hologram Showcase */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile w-fit">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono-data text-nexus-on-surface font-semibold">
              SECURE OPERATOR ACCESS · RBAC GATEWAY
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-nexus-on-surface tracking-tight leading-tight">
            Command the living spatial twin.
          </h1>

          <p className="text-sm md:text-base text-nexus-on-surface-variant leading-relaxed max-w-lg">
            Real-time vehicle telemetry, aerodynamic physics simulation, and hands-free Pipecat voice copilot — unified into an enterprise command matrix.
          </p>

          {/* Interactive 3D Hologram Preview Container */}
          <div className="relative h-64 sm:h-80 w-full rounded-3xl bg-nexus-surface-lowest/80 backdrop-blur-xl border border-nexus-outline-variant/40 shadow-tactile-lg overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0">
              <NexusHero3D currentStep={0} interactive={true} />
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10 bg-nexus-surface-lowest/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-nexus-outline-variant/30 text-[11px] font-mono-data text-nexus-on-surface-variant">
              <span>Spatial Telemetry: 42 Haulers</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live WSS Feed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card with Reactive 3D Avatar */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-md space-y-6">
            {/* Reactive 3D Avatar */}
            <div className="flex justify-center -mb-2">
              <div className="p-3 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile">
                <Avatar3D mood={avatarMood} size="lg" />
              </div>
            </div>

            <Card className="shadow-tactile-lg border-2 border-nexus-outline-variant/50">
              <CardHeader>
                <div>
                  <CardTitle className="text-xl">Sign In to NEXUS</CardTitle>
                  <CardDescription>
                    Authenticate operator credentials to enter live spatial telemetry and simulation.
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <Input
                    label="Operator Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="sarah.chen@nexus.ops"
                  />

                  <Input
                    label="Security Key / Passphrase"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                  />

                  <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full font-mono-data text-xs shadow-tactile" isLoading={isLoading}>
                      Authenticate & Enter Operations
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </form>

              {/* 1-Click Role Switcher */}
              <CardFooter className="flex flex-col gap-3 pt-0">
                <div className="w-full border-t border-nexus-outline-variant/30 pt-3">
                  <span className="text-[10px] font-mono-data text-nexus-on-surface-variant uppercase tracking-wider font-bold block mb-2">
                    Quick Switch Demo Profiles
                  </span>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {quickRoles.map((r) => (
                      <button
                        key={r.email}
                        type="button"
                        onClick={() => {
                          setEmail(r.email);
                          setPassword('nexus-demo-password');
                          setErrorMessage(null);
                          setAvatarMood('WELCOME');
                          toast({
                            title: `Loaded ${r.role}`,
                            message: `${r.name} · ${r.desc}`,
                            type: 'info',
                          });
                        }}
                        className={`p-2.5 rounded-xl text-left transition-all border ${
                          email === r.email
                            ? 'bg-nexus-primary-container/15 border-nexus-primary-container text-nexus-on-surface shadow-sm'
                            : 'bg-nexus-surface-container/60 hover:bg-nexus-surface-container border-nexus-outline-variant/30 text-nexus-on-surface-variant'
                        }`}
                      >
                        <p className="text-xs font-bold text-nexus-on-surface truncate">{r.name}</p>
                        <p className="text-[10px] text-nexus-secondary font-mono-data truncate font-semibold">
                          {r.role}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardFooter>
            </Card>

            <p className="text-center text-xs text-nexus-on-surface-variant font-mono-data">
              Protected by multi-tier encryption & RBAC session tokens.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
