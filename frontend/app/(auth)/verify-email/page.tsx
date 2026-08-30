'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D, AvatarMood } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, KeyRound, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [avatarMood, setAvatarMood] = React.useState<AvatarMood>('LOADING');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAvatarMood('SUCCESS');
      toast({
        title: 'Identity Verified',
        message: 'Your email confirmation token is valid.',
        type: 'success',
      });
      setTimeout(() => {
        router.push('/welcome');
      }, 500);
    }, 700);
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
            <CardTitle>Verify Operator Token</CardTitle>
            <CardDescription>
              Enter the 6-digit cryptographic verification code dispatched to your workspace email.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleVerify}>
            <CardContent className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="749201"
                className="text-center font-mono text-lg tracking-widest"
              />

              <Button type="submit" variant="primary" className="w-full font-mono-data text-xs" isLoading={isLoading}>
                Confirm Identity & Enter Hub
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </form>

          <CardFooter className="text-center text-xs text-nexus-on-surface-variant">
            Didn&apos;t receive token?{' '}
            <button
              type="button"
              onClick={() => toast({ title: 'Token Resent', message: 'New code sent to operator mailbox.', type: 'info' })}
              className="text-nexus-secondary font-medium hover:underline ml-1"
            >
              Resend Code
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
