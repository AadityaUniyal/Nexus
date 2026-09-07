import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-nexus-surface flex items-center justify-center p-6 text-nexus-on-surface">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 bg-nexus-surface-lowest p-8 rounded-2xl shadow-tactile-lg border border-nexus-outline-variant/50">
        <div className="w-16 h-16 bg-nexus-primary-container text-nexus-on-primary-container rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">404</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">System Entity Not Found</h1>
        <p className="text-nexus-on-surface-variant text-sm">
          The operation node or resource you are looking for does not exist in the current sector or has been decommissioned.
        </p>
        <div className="flex gap-4 w-full mt-4">
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return
            </Button>
          </Link>
          <Link href="/overview" className="flex-1">
            <Button variant="primary" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
