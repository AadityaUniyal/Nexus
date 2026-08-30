'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D, AvatarMood } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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
    setIsLoading(true);
    setAvatarMood('LOADING');

    setTimeout(() => {
      setIsLoading(false);
      setAvatarMood('SUCCESS');
      toast({
        title: 'Account Provisioned',
        message: 'Proceeding to workspace onboarding.',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/welcome');
      }, 600);
    }, 900);
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
        <div className="flex justify-center -mb-2">
          <Avatar3D mood={avatarMood} size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <div>
              <CardTitle>Create Operational Workspace</CardTitle>
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
                <Button type="submit" variant="primary" className="w-full font-mono-data text-xs" isLoading={isLoading}>
                  Provision Workspace & Onboard
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col gap-2 pt-0">
            <div className="text-center text-xs text-nexus-on-surface-variant">
              Already have an authorized profile?{' '}
              <Link href="/login" className="text-nexus-secondary font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
