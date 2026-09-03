'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  FileText,
  Bell,
  ArrowRight,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { FadeIn, SpringCard } from '@/components/motion';

export default function FeaturesIndexPage() {
  const [activeCategory, setActiveCategory] = React.useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Capabilities' },
    { id: 'OPERATIONS', label: 'Operations & 3D' },
    { id: 'INTELLIGENCE', label: 'AI & Simulation' },
    { id: 'GOVERNANCE', label: 'Analytics & Reporting' },
  ];

  const features = [
    {
      id: 'live-world',
      title: '3D Digital Twin & Live World',
      category: 'OPERATIONS',
      badge: 'Interactive WebGL',
      badgeVariant: 'healthy' as const,
      description:
        'Sub-second 3D geospatial visualization of nationwide distribution hubs, EV haulers, active corridors, and real-time environmental obstacles.',
      href: '/features/live-world',
      appHref: '/live-world',
      icon: Globe2,
      metrics: '36 Hubs · 120+ Active Telemetry Streams',
      highlights: [
        'Interactive 3D orbital canvas with raycasting',
        'Real-time vehicle battery & speed telemetry',
        'Live weather & corridor hazard mapping',
      ],
    },
    {
      id: 'incident-intelligence',
      title: 'Incident Intelligence Center',
      category: 'OPERATIONS',
      badge: 'Automated Root Cause',
      badgeVariant: 'critical' as const,
      description:
        'Continuous anomaly detection across fleet routes, identifying severe weather, dock bottlenecks, and mechanical degradation with automated triage.',
      href: '/features/incident-intelligence',
      appHref: '/incidents',
      icon: AlertTriangle,
      metrics: 'Deterministic SLA Risk Scoring',
      highlights: [
        'Automated multi-stage incident state machine',
        'Cost & delay impact estimations',
        'Audit-logged human-in-the-loop triage',
      ],
    },
    {
      id: 'simulation',
      title: 'Deterministic Simulation Lab',
      category: 'INTELLIGENCE',
      badge: 'What-If Modeling',
      badgeVariant: 'simulation' as const,
      description:
        'Sandboxed multi-scenario modeling engine running aerodynamic drag physics and multi-objective Pareto optimization without touching live data.',
      href: '/features/simulation',
      appHref: '/simulations',
      icon: Sparkles,
      metrics: 'Multi-Objective Pareto Frontier',
      highlights: [
        'Isolated scenario variable parametrization',
        'Physics-based energy & delay trade-off curves',
        'One-click deterministic decision deployment',
      ],
    },
    {
      id: 'analytics',
      title: 'Operational Analytics Engine',
      category: 'GOVERNANCE',
      badge: 'SLA Diagnostics',
      badgeVariant: 'attention' as const,
      description:
        'Deep operational telemetry analytics, fleet utilization distributions, corridor efficiency metrics, and SLA compliance dashboards.',
      href: '/features/analytics',
      appHref: '/analytics',
      icon: BarChart3,
      metrics: '99.4% On-Time Precision',
      highlights: [
        'Fleet utilization and load optimization',
        'Corridor risk and throughput analytics',
        'Historical SLA trend regressions',
      ],
    },
    {
      id: 'reports',
      title: 'Command Briefings & Reporting',
      category: 'GOVERNANCE',
      badge: 'AI Synthesis',
      badgeVariant: 'healthy' as const,
      description:
        'Instant executive briefings synthesized from live operational state, providing tactical guidance and audit-ready governance summaries.',
      href: '/features/reports',
      appHref: '/reports',
      icon: FileText,
      metrics: 'Instant Executive Synthesis',
      highlights: [
        'Automated operational telemetry synthesis',
        'Print-ready tactical and compliance reports',
        'Historical shift-by-shift briefing archive',
      ],
    },
    {
      id: 'notifications',
      title: 'Real-Time SSE Alert Outbox',
      category: 'OPERATIONS',
      badge: 'SSE Event Stream',
      badgeVariant: 'attention' as const,
      description:
        'High-frequency event notification stream backed by PostgreSQL transactional outbox, broadcasting state updates to operators instantly.',
      href: '/features/notifications',
      appHref: '/notifications',
      icon: Bell,
      metrics: '< 15ms Broadcast Latency',
      highlights: [
        'PostgreSQL transactional outbox pattern',
        'Live Server-Sent Events (SSE) stream',
        'Deep-linking to affected entities & incidents',
      ],
    },
  ];

  const filteredFeatures =
    activeCategory === 'ALL'
      ? features
      : features.filter((f) => f.category === activeCategory);

  const matrixItems = [
    {
      capability: 'Real-Time 3D Digital Twin (WebGL)',
      nexus: 'Yes (Three.js GPU-Accelerated)',
      legacy: 'No (2D Static Maps)',
      status: true,
    },
    {
      capability: 'Deterministic Physics Simulation Engine',
      nexus: 'Yes (Aerodynamic Drag & Pareto Frontier)',
      legacy: 'No (Basic Static Estimates)',
      status: true,
    },
    {
      capability: 'Sub-Second Event Outbox (SSE)',
      nexus: 'Yes (PostgreSQL Transactional Outbox)',
      legacy: 'No (Slow Polling / Daily Batches)',
      status: true,
    },
    {
      capability: 'Multi-Stage Incident State Machine',
      nexus: 'Yes (DETECTED → TRIAGED → MITIGATED → RESOLVED)',
      legacy: 'Partial (Unstructured notes)',
      status: true,
    },
    {
      capability: 'Tactical Voice AI Copilot',
      nexus: 'Yes (Real-time Speech Synthesis & Raycasting Dispatch)',
      legacy: 'No (Manual Form Entry)',
      status: true,
    },
    {
      capability: 'Strict Schema Input Validation & ACID Safety',
      nexus: 'Yes (FastAPI Pydantic + SQLAlchemy 2.0 Async)',
      legacy: 'Partial (Unvalidated Webhooks)',
      status: true,
    },
  ];

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      {/* Top Header */}
      <header className="h-20 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/overview"
            className="inline-flex items-center gap-2 text-sm text-nexus-on-surface-variant hover:text-nexus-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="h-4 w-px bg-nexus-outline-variant/40" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-nexus-primary-container text-white flex items-center justify-center font-bold text-xs">
              NX
            </div>
            <span className="font-bold tracking-tight">Platform Features</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/overview">
            <Button variant="primary" size="sm">
              Open Command Center
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 w-full space-y-16">
        {/* Hero Section */}
        <FadeIn className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="healthy" className="font-mono text-xs uppercase tracking-wider">
            NEXUS Next-Gen Architecture
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-nexus-on-surface">
            Engineered for Precision Logistics & Deterministic Control
          </h1>
          <p className="text-base sm:text-lg text-nexus-on-surface-variant leading-relaxed">
            Explore the comprehensive suite of operational, simulation, and intelligence capabilities powering the NEXUS logistics ecosystem.
          </p>
        </FadeIn>

        {/* Category Filter Tabs */}
        <div className="flex justify-center">
          <Tabs
            tabs={categories}
            activeTab={activeCategory}
            onChange={setActiveCategory}
            variant="pill"
            layoutId="featureCategoryFilter"
          />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <SpringCard
                key={feat.id}
                className="p-6 flex flex-col justify-between space-y-6 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile hover:border-nexus-secondary/60 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-nexus-surface-container text-nexus-secondary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant={feat.badgeVariant} className="text-[10px] font-mono-data">
                      {feat.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-nexus-on-surface tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-xs font-mono-data text-nexus-secondary font-semibold mt-0.5">
                      {feat.metrics}
                    </p>
                  </div>

                  <p className="text-xs text-nexus-on-surface-variant leading-relaxed">
                    {feat.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-nexus-outline-variant/30">
                    {feat.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-nexus-on-surface">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-nexus-outline-variant/30 flex items-center justify-between gap-2">
                  <Link href={feat.href} className="text-xs font-semibold text-nexus-primary hover:underline inline-flex items-center gap-1">
                    Feature Briefing <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={feat.appHref}>
                    <Button variant="secondary" size="sm" className="text-xs font-mono-data">
                      Open Module
                    </Button>
                  </Link>
                </div>
              </SpringCard>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <FadeIn className="space-y-6 pt-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-nexus-on-surface">
              Platform Architecture Matrix
            </h2>
            <p className="text-xs sm:text-sm text-nexus-on-surface-variant">
              How NEXUS deterministic engineering compares to conventional logistics dashboards.
            </p>
          </div>

          <div className="rounded-2xl border border-nexus-outline-variant/40 bg-nexus-surface-lowest shadow-tactile overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-nexus-outline-variant/40 bg-nexus-surface-container-low/60 font-mono-data text-nexus-on-surface-variant uppercase">
                    <th className="py-3.5 px-6 font-bold">Platform Capability</th>
                    <th className="py-3.5 px-6 font-bold text-nexus-secondary">NEXUS Platform</th>
                    <th className="py-3.5 px-6 font-bold">Legacy TMS / Mocks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-outline-variant/30">
                  {matrixItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-nexus-surface-container/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-nexus-on-surface flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-nexus-secondary shrink-0" />
                        {item.capability}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-nexus-secondary font-mono-data">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          {item.nexus}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-nexus-on-surface-variant font-mono-data">
                        <span className="inline-flex items-center gap-1.5 text-stone-500">
                          <XCircle className="h-4 w-4 text-stone-400" />
                          {item.legacy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      </main>

      {/* Footer */}
      <footer className="border-t border-nexus-outline-variant/30 bg-nexus-surface py-8 px-8 text-center text-xs text-nexus-on-surface-variant font-mono-data">
        NEXUS Operational Command · High-Assurance Logistics Intelligence
      </footer>
    </div>
  );
}
