import Link from 'next/link';
import { ArrowRight, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-12 text-stone-900 dark:bg-stone-950 dark:text-white">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-7 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-10">
        <p className="text-xs font-medium text-stone-500">Workspace setup</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">You’re ready to bring in shipment data.</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-400">No vehicles, routes, telemetry or provider connections are created by this screen. Shipment records become available after an import succeeds or a connected source supplies them.</p>
        <Link href="/import-data" className="mt-7 block">
          <Button variant="primary" className="w-full gap-2">Import a CSV <FileUp className="h-4 w-4" /></Button>
        </Link>
        <Link href="/operations/orders" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:underline dark:text-stone-300">
          Open shipments <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
