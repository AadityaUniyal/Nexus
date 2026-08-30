'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function ReportsFeaturePage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="h-4 w-px bg-nexus-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span className="font-bold tracking-tight">Executive Reports</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="primary" size="sm">Open Reports</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-8 py-16 w-full space-y-16">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="healthy" className="font-mono text-xs uppercase tracking-wider">
              Deterministic Audited Reports
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display text-nexus-on-surface">
              Automated Operational Briefings & Compliance Exports
            </h1>
            <p className="text-lg text-nexus-on-surface-variant leading-relaxed">
              Generate daily operational digests, fleet health reports, warehouse throughput summaries, and carbon footprint audits with deterministic data provenance.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/reports">
                <Button variant="primary" size="lg" className="gap-2">
                  View Saved Reports <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="p-8 rounded-3xl bg-nexus-surface-container/60 border border-nexus-surface-container-high shadow-tactile flex flex-col items-center">
              <Avatar3D mood="SUCCESS" size="hero" />
              <div className="mt-4 text-center">
                <span className="text-xs font-mono font-medium text-nexus-secondary">REPORT GENERATOR</span>
                <p className="text-sm text-nexus-on-surface-variant">Ready for automated export</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpringCard className="p-8 space-y-4">
            <FileText className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">Daily Briefings</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Executive-ready operational overviews detailing route completion rates and bottleneck resolutions.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <Download className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">Multi-Format Export</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Export data cleanly as JSON, CSV, or formatted PDF documents with cryptographic integrity hashes.
            </p>
          </SpringCard>
          <SpringCard className="p-8 space-y-4">
            <ShieldCheck className="h-8 w-8 text-nexus-secondary" />
            <h3 className="text-xl font-bold">Compliance Audits</h3>
            <p className="text-sm text-nexus-on-surface-variant">
              Maintain verifiable records of temperature compliance and DOT driver log hours for regulatory audits.
            </p>
          </SpringCard>
        </div>
      </main>
    </div>
  );
}
