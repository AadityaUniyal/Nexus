'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <LogoMark size={34} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Workspace Provisioning
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span>Already authorized?</span>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-nexus-outline-variant/40 bg-nexus-surface-container/60 hover:bg-nexus-surface-container text-nexus-on-surface font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Centered Sign-Up */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-6 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-nexus-on-surface">Provision Workspace</h1>
            <p className="text-xs font-mono-data text-nexus-on-surface-variant">
              Register operator credentials and initialize dedicated logistics partition.
            </p>
          </div>
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            fallbackRedirectUrl="/welcome"
            appearance={{
              elements: {
                rootBox: 'w-full shadow-tactile-lg rounded-2xl',
                card: 'border border-nexus-outline-variant/40 rounded-2xl shadow-tactile-md bg-nexus-surface-lowest',
              },
            }}
          />
          <p className="mt-6 text-center text-xs text-nexus-on-surface-variant font-mono-data">
            Multi-tenant enterprise partition with ACID isolation.
          </p>
        </div>
      </main>
    </div>
  );
}
