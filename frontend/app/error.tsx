'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NEXUS Error Boundary] Caught operational runtime fault:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-nexus-surface flex items-center justify-center p-6 text-nexus-on-surface">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 bg-nexus-surface-lowest p-8 rounded-2xl shadow-tactile-lg border border-nexus-error/30">
        <div className="w-16 h-16 bg-nexus-error/10 text-nexus-error rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-nexus-error">Operational Fault Flagged</h1>
        <p className="text-nexus-on-surface-variant text-sm bg-nexus-surface-container/50 p-3 rounded-lg w-full text-left font-mono text-xs overflow-auto">
          {error.message || 'An unexpected runtime operational fault occurred.'}
        </p>

        {error.digest && (
          <div className="w-full text-left font-mono text-[10px] text-nexus-on-surface-variant/70 border-t border-nexus-outline/10 pt-2">
            Trace ID: <span className="text-nexus-primary">{error.digest}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 w-full pt-2">
          <Button onClick={() => reset()} variant="secondary" className="w-full text-xs">
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            Reboot View
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full text-xs">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
