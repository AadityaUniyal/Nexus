import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalystDashboard() {
  return (
    <Card className="mx-auto max-w-3xl border-stone-200 shadow-sm dark:border-stone-800">
      <CardHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="mt-3 text-xl">Analysis is not available yet</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">
          Forecasts, confidence scores and savings estimates are not shown until their source data, calculation and validation can be traced to this workspace. The current launch workflow focuses on shipment records and exception handling.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
          <Link href="/operations/orders" className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 hover:underline dark:text-white">Review shipments <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/incidents" className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:underline dark:text-stone-300">Review exceptions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </CardContent>
    </Card>
  );
}
