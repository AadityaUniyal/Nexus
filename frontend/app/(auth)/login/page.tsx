'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <LogoMark size={34} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Command Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span>Need an enterprise tenant?</span>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-lg border border-nexus-outline-variant/40 bg-nexus-surface-container/60 hover:bg-nexus-surface-container text-nexus-on-surface font-semibold transition-colors"
          >
            Provision Workspace
          </Link>
        </div>
      </header>

      {/* Main Centered Sign-In */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-6 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-nexus-on-surface">Operator Sign In</h1>
            <p className="text-xs font-mono-data text-nexus-on-surface-variant">
              Authenticate operator credentials to enter live telemetry and analytics.
            </p>
          </div>
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/overview"
            appearance={{
              elements: {
                rootBox: 'w-full shadow-tactile-lg rounded-2xl',
                card: 'border border-nexus-outline-variant/40 rounded-2xl shadow-tactile-md bg-nexus-surface-lowest',
              },
            }}
          />
          <p className="mt-6 text-center text-xs text-nexus-on-surface-variant font-mono-data">
            Protected by multi-tier encryption &amp; enterprise RBAC session tokens.
          </p>
        </div>
      </main>
    </div>
  );
}
