import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingNotificationsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-12 text-stone-900 dark:bg-stone-950 dark:text-white">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-7 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-10">
        <p className="text-xs font-medium text-stone-500">Workspace setup · Final step</p>
        <span className="mt-6 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"><Bell className="h-5 w-5" aria-hidden="true" /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Notification preferences</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">Notification delivery preferences are not available to configure here yet. This step will not create alert rules or subscribe you to a live event stream.</p>
        <div className="mt-8 flex items-center justify-between">
          <Link href="/role" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:underline dark:text-stone-400"><ArrowLeft className="h-4 w-4" />Back</Link>
          <Link href="/complete"><Button variant="primary">Finish setup<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </main>
  );
}
