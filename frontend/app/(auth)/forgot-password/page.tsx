'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
      toast({
        title: 'Recovery Link Dispatched',
        message: 'Check your enterprise email for reset credentials.',
        type: 'info',
      });
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
          <Avatar3D mood={sent ? 'SUCCESS' : 'WARNING'} size="lg" />
        </div>

        <Card className="shadow-tactile-lg">
          <CardHeader>
            <CardTitle>{sent ? 'Recovery Dispatched' : 'Reset Access Key'}</CardTitle>
            <CardDescription>
              {sent
                ? 'A time-limited cryptographic reset authorization has been generated.'
                : 'Enter your registered operator email to receive a password reset token.'}
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent className="space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-nexus-secondary mx-auto" />
              <p className="text-xs text-nexus-on-surface-variant">
                If an authorized profile exists for <span className="font-mono text-nexus-primary">{email}</span>, you will receive instructions within 60 seconds.
              </p>
              <Link href="/reset-password">
                <Button variant="primary" className="w-full font-mono text-xs mt-2">
                  Proceed with Reset Token
                </Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@nexus.ops"
                />

                <Button type="submit" variant="primary" className="w-full font-mono-data text-xs" isLoading={isLoading}>
                  Dispatch Reset Authorization
                </Button>
              </CardContent>
            </form>
          )}

          <CardFooter className="flex justify-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-nexus-on-surface-variant hover:text-nexus-primary">
              <ArrowLeft className="h-3 w-3" /> Return to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
