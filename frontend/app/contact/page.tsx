'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar3D } from '@/components/avatar/Avatar3D';
import { FadeIn, SpringCard } from '@/components/motion';

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    company: '',
    fleetSize: '10-50',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            <span className="font-bold tracking-tight">Contact & Enterprise Advisory</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
        <FadeIn className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
                Connect with NEXUS Operations Advisory
              </h1>
              <p className="text-nexus-on-surface-variant leading-relaxed">
                Whether deploying across 50 regional trucks or 5,000 global multimodal freight containers, our systems architecture team is ready to assist.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-nexus-secondary-container/40 text-nexus-secondary flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Enterprise Inquiries</h4>
                  <p className="text-xs text-nexus-on-surface-variant font-mono">solutions@nexus-operations.io</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-nexus-secondary-container/40 text-nexus-secondary flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Priority Operations Dispatch</h4>
                  <p className="text-xs text-nexus-on-surface-variant font-mono">+1 (800) 555-0199 (24/7)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-nexus-secondary-container/40 text-nexus-secondary flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Systems Headquarters</h4>
                  <p className="text-xs text-nexus-on-surface-variant">500 Industrial Parkway, Chicago, IL 60607</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-nexus-surface-container border border-nexus-surface-container-high flex items-center gap-4">
              <Avatar3D mood="WELCOME" size="md" />
              <div>
                <span className="text-xs font-mono text-nexus-secondary font-bold">DEDICATED ADVISORY</span>
                <p className="text-xs text-nexus-on-surface-variant">Avg response time under 15 minutes</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submitted ? (
              <SpringCard className="p-10 text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-nexus-secondary mx-auto" />
                <h2 className="text-2xl font-bold">Message Received</h2>
                <p className="text-sm text-nexus-on-surface-variant max-w-md mx-auto">
                  A NEXUS systems architect has been assigned to your workspace profile and will connect with you shortly.
                </p>
                <div className="pt-4">
                  <Button variant="secondary" onClick={() => setSubmitted(false)}>
                    Send Another Note
                  </Button>
                </div>
              </SpringCard>
            ) : (
              <SpringCard className="p-8 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                        Full Name
                      </label>
                      <Input
                        required
                        placeholder="Alex Morgan"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                        Corporate Email
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="a.morgan@logistics.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                        Enterprise Name
                      </label>
                      <Input
                        required
                        placeholder="Apex Multimodal Ltd"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                        Active Fleet Size
                      </label>
                      <select
                        value={form.fleetSize}
                        onChange={(e) => setForm({ ...form, fleetSize: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30"
                      >
                        <option value="1-20">1 - 20 Assets</option>
                        <option value="20-100">20 - 100 Assets</option>
                        <option value="100-500">100 - 500 Assets</option>
                        <option value="500+">500+ Assets (Enterprise Grid)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-nexus-on-surface-variant uppercase">
                      Operational Objectives
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Outline your dispatch bottlenecks, Azure/Fabric integration targets, or simulation requirements..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full p-3 rounded-lg border border-nexus-outline-variant bg-nexus-surface text-sm focus:outline-none focus:ring-2 focus:ring-nexus-secondary/30 resize-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full gap-2">
                    <Send className="h-4 w-4" /> Request Systems Consultation
                  </Button>
                </form>
              </SpringCard>
            )}
          </div>
        </FadeIn>
      </main>
    </div>
  );
}
