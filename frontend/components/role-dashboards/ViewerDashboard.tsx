import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ViewerDashboard() {
  return (
    <Card className="mx-auto max-w-3xl border-stone-200 shadow-sm dark:border-stone-800">
      <CardHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="mt-3 text-xl">Operational reports are not available yet</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">
          This workspace does not have a verified reporting feed connected. Nexus will show a report here when its source, time range and calculation can be traced to your saved records.
        </p>
        <Link href="/operations/orders" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-900 hover:underline dark:text-white">
          Review shipment records <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
