"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  ScanSearch,
  GitBranch,
  FileText,
  ShieldCheck,
  Database,
  Cloud,
  Gauge,
  Check,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "Operational KPIs",
    body: "SLA adherence, turnaround time, hub throughput and fleet utilisation, computed live from your own data.",
  },
  {
    icon: LineChart,
    title: "Forecasting",
    body: "Demand and SLA forecasts with P10/P50/P90 confidence bands so planners can staff and route ahead of time.",
  },
  {
    icon: ScanSearch,
    title: "Anomaly detection",
    body: "Isolation-forest models flag unusual vehicle telemetry and delays before they turn into missed deliveries.",
  },
  {
    icon: AlertTriangle,
    title: "Risk scoring",
    body: "Every active order gets a composite risk score from weather, capacity, route and priority signals.",
  },
  {
    icon: GitBranch,
    title: "Scenario planning",
    body: "Compare reroutes and capacity moves side by side, with cost and time deltas, before you commit.",
  },
  {
    icon: FileText,
    title: "AI-written reports",
    body: "Executive briefings and narrative insights generated from live metrics, with exact figures cited.",
  },
];

const STACK = [
  { icon: Gauge, name: "Vercel Edge", desc: "Next.js frontend, global CDN" },
  { icon: Cloud, name: "Azure App Service", desc: "FastAPI analytics API" },
  { icon: Database, name: "Neon Postgres", desc: "Serverless primary database" },
  { icon: LineChart, name: "Application Insights", desc: "Requests, traces, product events" },
  { icon: Database, name: "Azure Blob Storage", desc: "Bronze / silver / gold data lake" },
  { icon: ShieldCheck, name: "Azure Key Vault", desc: "Secrets and key management" },
];

/* Lightweight static product preview so the hero loads instantly. */
function ProductPreview() {
  const bars = [62, 70, 58, 76, 84, 79, 91, 88, 94, 90, 97, 93];
  const line = "M0,58 C30,52 50,40 80,44 C110,48 130,30 160,26 C190,22 210,30 240,18 C270,8 290,14 320,6";
  return (
    <div className="rounded-2xl border border-nexus-outline-variant bg-nexus-surface-lowest shadow-tactile-lg overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 h-10 border-b border-nexus-outline-variant/70 bg-nexus-surface-container-low">
        <span className="h-2.5 w-2.5 rounded-full bg-nexus-outline-variant" />
        <span className="h-2.5 w-2.5 rounded-full bg-nexus-outline-variant" />
        <span className="h-2.5 w-2.5 rounded-full bg-nexus-outline-variant" />
        <span className="ml-3 text-xs text-nexus-on-surface-variant">nexus / analytics</span>
      </div>
      <div className="p-5 grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "SLA adherence", v: "97.4%", d: "+1.2 pts" },
            { k: "Avg turnaround", v: "42 min", d: "-6 min" },
            { k: "Orders at risk", v: "18", d: "-4 today" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-nexus-outline-variant/70 p-3">
              <p className="text-[11px] text-nexus-on-surface-variant">{m.k}</p>
              <p className="mt-1 text-lg font-semibold font-mono-data text-nexus-on-surface">{m.v}</p>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{m.d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 rounded-xl border border-nexus-outline-variant/70 p-3">
            <p className="text-[11px] text-nexus-on-surface-variant mb-2">Delivery volume forecast</p>
            <svg viewBox="0 0 320 70" className="w-full h-20" aria-hidden>
              <path d={`${line} L320,70 L0,70 Z`} fill="var(--brand-100)" opacity="0.7" />
              <path d={line} fill="none" stroke="var(--brand-600)" strokeWidth="2.2" />
              <path d="M240,18 C270,8 290,14 320,6" fill="none" stroke="var(--accent-500)" strokeWidth="2.2" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="col-span-2 rounded-xl border border-nexus-outline-variant/70 p-3">
            <p className="text-[11px] text-nexus-on-surface-variant mb-2">Hub utilisation</p>
            <div className="flex items-end gap-1 h-20" aria-hidden>
              {bars.map((b, i) => (
                <div
                  key={i}
                  className={i === bars.length - 2 ? "flex-1 rounded-sm bg-accent-500" : "flex-1 rounded-sm bg-brand-300"}
                  style={{ height: `${b}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-brand-50 dark:bg-nexus-secondary-container p-3 text-xs text-nexus-on-surface leading-relaxed">
          <span className="font-semibold text-brand-800 dark:text-nexus-on-secondary-container">Insight · </span>
          Chicago hub is at 92% capacity and trending up. Moving 1,200 units to Dallas keeps SLA above 96% this week.
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col">
      <header className="sticky top-0 z-50 border-b border-nexus-outline-variant/60 bg-nexus-surface/90 backdrop-blur supports-[backdrop-filter]:bg-nexus-surface/75">
        <div className="max-w-6xl mx-auto h-16 px-5 md:px-8 flex items-center justify-between">
          <Logo href="/" />
          <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm text-nexus-on-surface-variant">
            <a href="#product" className="hover:text-nexus-on-surface transition-colors">Product</a>
            <a href="#how" className="hover:text-nexus-on-surface transition-colors">How it works</a>
            <a href="#technology" className="hover:text-nexus-on-surface transition-colors">Platform</a>
            <Link href="/faq" className="hover:text-nexus-on-surface transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex h-9 items-center px-3 text-sm font-medium text-nexus-on-surface hover:text-brand-700">
              Sign in
            </Link>
            <ButtonLink href="/signup" size="sm" data-track="landing_header_signup">Get started</ButtonLink>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-grid [mask-image:linear-gradient(to_bottom,black,transparent_75%)] opacity-60" />
          <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-16 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
            <div>
              <motion.p {...fade} className="inline-flex items-center gap-2 rounded-full border border-nexus-outline-variant bg-nexus-surface-lowest px-3 py-1 text-xs font-medium text-nexus-on-surface-variant">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                Analytics for logistics and fleet teams
              </motion.p>
              <motion.h1 {...fade} className="mt-5 text-[2.5rem] md:text-6xl font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
                Know what&apos;s happening in your network, and what happens next.
              </motion.h1>
              <motion.p {...fade} className="mt-5 text-lg text-nexus-on-surface-variant max-w-xl leading-relaxed">
                Nexus connects orders, vehicles and warehouses into one analytics workspace. Track KPIs live,
                forecast demand, catch anomalies early and test decisions before you make them.
              </motion.p>
              <motion.div {...fade} className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup" size="lg" data-track="landing_hero_signup">
                  Start free <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/analytics" size="lg" variant="secondary" data-track="landing_hero_demo">
                  View live dashboard
                </ButtonLink>
              </motion.div>
              <motion.ul {...fade} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-nexus-on-surface-variant">
                {["No credit card", "CSV import in minutes", "Role-based access"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-brand-600" aria-hidden /> {t}
                  </li>
                ))}
              </motion.ul>
            </div>
            <motion.div {...fade}>
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        {/* Metrics strip */}
        <section aria-label="Platform highlights" className="border-y border-nexus-outline-variant/60 bg-nexus-surface-lowest">
          <dl className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { k: "Forecast horizon", v: "7 days" },
              { k: "Anomaly models", v: "Isolation forest" },
              { k: "Data refresh", v: "Real-time" },
              { k: "Hosting cost", v: "Free tier" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-sm text-nexus-on-surface-variant">{s.k}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section id="product" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 scroll-mt-16">
          <motion.div {...fade} className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700 dark:text-nexus-primary">Product</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.025em]">
              Everything an operations analyst needs, in one place
            </h2>
            <p className="mt-4 text-nexus-on-surface-variant leading-relaxed">
              Replace spreadsheets and disconnected tools with a single source of truth for performance, risk and planning.
            </p>
          </motion.div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <motion.article key={f.title} {...fade} className="tactile-card tactile-card-interactive p-6">
                <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-nexus-secondary-container flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-brand-700 dark:text-nexus-on-secondary-container" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-nexus-on-surface-variant leading-relaxed">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-nexus-surface-container-low border-y border-nexus-outline-variant/60 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
            <motion.h2 {...fade} className="text-3xl md:text-4xl font-semibold tracking-[-0.025em] max-w-2xl">
              From raw data to a decision in three steps
            </motion.h2>
            <ol className="mt-12 grid md:grid-cols-3 gap-8">
              {[
                { n: "1", t: "Connect", d: "Import CSVs or stream telemetry. Nexus validates and stores everything in Postgres." },
                { n: "2", t: "Analyse", d: "Dashboards, forecasts and anomaly alerts update automatically as data arrives." },
                { n: "3", t: "Decide", d: "Run what-if scenarios, share AI-written briefings and track the outcome." },
              ].map((s) => (
                <motion.li key={s.n} {...fade} className="relative pl-14">
                  <span className="absolute left-0 top-0 h-10 w-10 rounded-full bg-brand-700 text-white flex items-center justify-center font-semibold">
                    {s.n}
                  </span>
                  <h3 className="font-semibold text-lg">{s.t}</h3>
                  <p className="mt-2 text-sm text-nexus-on-surface-variant leading-relaxed">{s.d}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Platform */}
        <section id="technology" className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 scroll-mt-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div {...fade}>
              <p className="text-sm font-semibold text-brand-700 dark:text-nexus-primary">Platform</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.025em]">
                Built on a cloud stack you can trust
              </h2>
              <p className="mt-4 text-nexus-on-surface-variant leading-relaxed">
                Every request, AI call and product event is traced in Azure Application Insights. Raw data is
                archived to Blob Storage in medallion tiers, and secrets stay in Key Vault.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Clerk authentication with role-based access control",
                  "Groq and Gemini language models with automatic fallback",
                  "Rate limiting, strict security headers and audit logs",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-brand-600 shrink-0" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fade} className="grid grid-cols-2 gap-3">
              {STACK.map((s) => (
                <div key={s.name} className="tactile-card p-4">
                  <s.icon className="h-5 w-5 text-brand-600" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-nexus-on-surface-variant mt-0.5">{s.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-5 md:px-8 pb-24">
          <motion.div {...fade} className="rounded-2xl bg-brand-800 text-white px-8 py-12 md:px-14 md:py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">See your operations clearly, starting today.</h2>
              <p className="mt-3 text-brand-100">Create a workspace, load sample data and explore every dashboard in under five minutes.</p>
            </div>
            <ButtonLink href="/signup" size="lg" variant="inverse" data-track="landing_cta_signup">
              Create free workspace <TrendingUp className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-nexus-outline-variant/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row gap-6 md:items-center justify-between text-sm text-nexus-on-surface-variant">
          <div className="flex items-center gap-3">
            <Logo href="/" size={26} />
            <span>© {new Date().getFullYear()} Nexus Analytics</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-6">
            <Link href="/features" className="hover:text-nexus-on-surface">Features</Link>
            <Link href="/faq" className="hover:text-nexus-on-surface">FAQ</Link>
            <Link href="/contact" className="hover:text-nexus-on-surface">Contact</Link>
            <Link href="/feedback" className="hover:text-nexus-on-surface">Feedback</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
