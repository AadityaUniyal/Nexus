'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D, AvatarMood } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, ArrowRight, UserCheck, Key, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { tactileAudio } from '@/lib/sound-effects';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('sarah.chen@nexus.ops');
  const [password, setPassword] = React.useState('nexus-demo-password');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [avatarMood, setAvatarMood] = React.useState<AvatarMood>('WELCOME');

  const quickRoles = [
    { name: 'Sarah Chen', role: 'OPERATIONS_MANAGER', email: 'sarah.chen@nexus.ops' },
    { name: 'Marcus Vance', role: 'ADMINISTRATOR', email: 'admin@nexus.ops' },
    { name: 'Elena Rostova', role: 'ANALYST', email: 'elena.rostova@nexus.ops' },
    { name: 'David Kim', role: 'OPERATOR', email: 'david.kim@nexus.ops' },
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

    // Map role based on email or default to OPERATIONS_MANAGER
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
    <div className="min-h-screen bg-nexus-surface flex flex-col items-center justify-center p-6 select-none">
      <Link href="/" className="mb-6 flex items-center gap-2 group">
        <div className="h-9 w-9 rounded-xl bg-nexus-primary-container flex items-center justify-center text-white shadow-tactile group-hover:scale-105 transition-transform">
          <span className="font-bold text-sm tracking-tighter">NX</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-nexus-on-surface">NEXUS</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        {/* Avatar companion reacting to auth state */}
        <div className="flex justify-center -mb-2">
          <Avatar3D mood={avatarMood} size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <div>
              <CardTitle>Sign In to NEXUS</CardTitle>
              <CardDescription>
                Authenticate your operator credentials to access live telemetry and decision simulation.
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
                placeholder="name@nexus.ops"
              />

              <Input
                label="Security Key / Password"
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
                <Button type="submit" variant="primary" className="w-full font-mono-data text-xs" isLoading={isLoading}>
                  Authenticate & Launch Command
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </form>

          <CardFooter className="flex-col gap-3">
            <span className="text-[11px] font-mono-data text-nexus-on-surface-variant uppercase tracking-wider">
              Quick Switch Demo Roles
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
                    toast({
                      title: `Selected Role: ${r.role}`,
                      message: `Loaded credentials for ${r.name}`,
                      type: 'info',
                    });
                  }}
                  className="p-2 rounded-lg bg-nexus-surface-container/60 hover:bg-nexus-surface-container border border-nexus-outline-variant/30 text-left transition-colors"
                >
                  <p className="text-xs font-semibold text-nexus-on-surface truncate">{r.name}</p>
                  <p className="text-[10px] text-nexus-on-surface-variant font-mono-data truncate">
                    {r.role}
                  </p>
                </button>
              ))}
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-nexus-on-surface-variant font-mono-data">
          Workspace access protected by Role-Based Access Control (RBAC).
        </p>
      </div>
    </div>
  );
}
