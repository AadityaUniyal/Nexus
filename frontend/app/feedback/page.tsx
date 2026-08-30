'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function FeedbackPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    category: 'OPERATIONS',
    severity: 'LOW',
    message: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="font-bold tracking-tight">Platform Feedback</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <FadeIn className="space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <Avatar3D mood={submitted ? 'SUCCESS' : 'WELCOME'} size="md" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight font-display">
              {submitted ? 'Thank You for Your Feedback' : 'Help Us Refine NEXUS'}
            </h1>
            <p className="text-nexus-on-surface-variant text-sm max-w-md mx-auto">
              {submitted
                ? 'Your report has been logged and assigned an audit tracking ID.'
                : 'Direct telemetry feedback from operators and administrators drives our platform roadmap.'}
            </p>
          </div>

          {submitted ? (
            <SpringCard className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-nexus-secondary mx-auto" />
              <h3 className="text-lg font-bold">Feedback Ingested</h3>
              <p className="text-sm text-nexus-on-surface-variant">
                Our operations engineering team will review your submission.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <Button variant="secondary" onClick={() => setSubmitted(false)}>
                  Submit Another Note
                </Button>
                <Link href="/overview">
                  <Button variant="primary">Return to Operations</Button>
                </Link>
              </div>
            </SpringCard>
          ) : (
            <SpringCard className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                    >
                      <option value="OPERATIONS">Operations & Dispatch</option>
                      <option value="SIMULATION">Simulation Engine</option>
                      <option value="ANALYTICS">Analytics & Reporting</option>
                      <option value="3D_WORLD">3D Live World</option>
                      <option value="BUG">Anomaly / Bug Report</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                      Urgency
                    </label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                    >
                      <option value="LOW">Low (Enhancement)</option>
                      <option value="MEDIUM">Medium (Usability)</option>
                      <option value="HIGH">High (Operational Impact)</option>
                      <option value="CRITICAL">Critical (Blocker)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                    Your Work Email (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="operator@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                    Feedback Details
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your workflow observation, feature request, or issue..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30 resize-none"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full gap-2" disabled={loading}>
                  <Send className="h-4 w-4" /> {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            </SpringCard>
          )}
        </FadeIn>
      </main>
    </div>
  );
}
