'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function FAQPage() {
  const [search, setSearch] = React.useState('');
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: 'How does NEXUS differ from standard fleet management dashboards?',
      a: 'NEXUS pairs a full 3D spatial digital twin with a deterministic what-if simulation engine. Rather than simply displaying past GPS tracks, NEXUS enables operators to model reroutes, dock capacity changes, and vehicle breakdowns in an isolated lavender sandbox before executing changes transactionally to live operations.',
    },
    {
      q: 'Does NEXUS require an external AI API to operate?',
      a: 'No. The core business rules, simulation engine, risk models, SLA compliance tracking, and incident state machines are 100% deterministic and execute locally without external AI dependencies. Optional AI providers (like Groq) can be enabled to generate executive summaries and automated briefings.',
    },
    {
      q: 'How does the Simulation Lab prevent unintended modifications to live fleet data?',
      a: 'Simulations operate in an isolated hypothetical branch (marked with dashed borders and lavender purple styling). Live dispatch data remains read-only to simulations until an authorized operator explicitly clicks "Apply Decision", which executes an ACID transaction with complete audit logging.',
    },
    {
      q: 'Can NEXUS integrate with Microsoft Fabric and Azure OneLake?',
      a: 'Yes. NEXUS includes explicit adapter boundaries for Bronze/Silver/Gold data pipelines, Azure services, and OneLake telemetry synchronization without coupling core business logic to cloud vendor SDKs.',
    },
    {
      q: 'What role-based permissions are supported in the Admin Suite?',
      a: 'NEXUS provides 5 standard roles: ADMINISTRATOR, OPERATIONS_MANAGER, ANALYST, OPERATOR, and VIEWER. Permissions govern viewing/editing operations, running simulations, applying decisions, and viewing audit trails with backend RBAC enforcement.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/overview" className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="h-4 w-px bg-nexus-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span className="font-bold tracking-tight">Frequently Asked Questions</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-10">
        <FadeIn className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <Avatar3D mood="WELCOME" size="md" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-display">
            Platform Architecture & Operations FAQ
          </h1>
          <p className="text-nexus-on-surface-variant max-w-lg mx-auto text-sm">
            Everything you need to know about spatial telemetry, deterministic simulation, RBAC security, and cloud data boundaries.
          </p>

          <div className="max-w-md mx-auto relative pt-4">
            <Search className="h-4 w-4 absolute left-3 top-7 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search architecture questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </FadeIn>

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <SpringCard key={index} className="overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-nexus-on-surface"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-nexus-secondary transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-nexus-on-surface-variant leading-relaxed border-t border-nexus-surface-container-high pt-4">
                    {faq.a}
                  </div>
                )}
              </SpringCard>
            );
          })}
        </div>
      </main>
    </div>
  );
}
