'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, FileUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Start with a shipment file',
    description: 'Choose a CSV from your operation. Review the detected fields and row-level issues before confirming an import.',
    note: 'Preview is for review. It does not save shipment records.',
    icon: FileUp,
  },
  {
    title: 'Find the record you need',
    description: 'Search the shipment list and open a record to review the status, source details and updates available in your workspace.',
    note: 'Missing or old source data should be treated as unknown, not as a live position.',
    icon: Package,
  },
  {
    title: 'Record the next step',
    description: 'When an exception is present, review its evidence, choose an allowed status change and record who owns the follow-up.',
    note: 'A saved Nexus update does not mean a carrier or driver system was updated.',
    icon: AlertCircle,
  },
];

export default function QuickTourPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const Icon = step.icon;

  const finish = () => {
    window.localStorage.setItem('nexus_onboarding_completed', 'true');
    router.push('/import-data');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-12 text-stone-900 dark:bg-stone-950 dark:text-white">
      <section className="w-full max-w-2xl" aria-labelledby="tour-title">
        <div className="mb-8 flex items-center justify-center gap-2" aria-label={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((item, stepIndex) => <span key={item.title} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${index === stepIndex ? 'w-8 bg-stone-800 dark:bg-stone-200' : 'w-2 bg-stone-300 dark:bg-stone-700'}`} />)}
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"><Icon className="h-5 w-5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-medium text-stone-500">How the first workflow works</p>
          <h1 id="tour-title" className="mt-2 text-3xl font-semibold tracking-tight">{step.title}</h1>
          <p className="mt-4 text-base leading-7 text-stone-600 dark:text-stone-400">{step.description}</p>
          <div className="mt-6 flex gap-3 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:bg-stone-800/70 dark:text-stone-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{step.note}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}><ArrowLeft className="mr-2 h-4 w-4" />Previous</Button>
            <Button variant="primary" onClick={() => index === steps.length - 1 ? finish() : setIndex((value) => value + 1)}>
              {index === steps.length - 1 ? 'Start with CSV import' : 'Next'}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
