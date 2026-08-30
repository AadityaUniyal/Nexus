'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        message: 'Passphrases do not match.',
        type: 'critical',
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Credentials Updated',
        message: 'Your new security passphrase is active. Please log in.',
        type: 'success',
      });
      router.push('/login');
    }, 800);
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
          <Avatar3D mood="WELCOME" size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>Set New Passphrase</CardTitle>
            <CardDescription>
              Configure strong cryptographic credentials for your operational profile.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Input
                label="Reset Authorization Token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="RST-948210"
              />

              <Input
                label="New Security Passphrase"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <Input
                label="Confirm Passphrase"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <Button type="submit" variant="primary" className="w-full font-mono-data text-xs" isLoading={isLoading}>
                Update Security Credentials & Log In
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex justify-center">
            <Link href="/login" className="text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
              Cancel & Return to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
