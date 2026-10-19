import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Smartphone,
  ChevronRight,
  Database,
  Cloud,
  Lock,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-[#0071E3] selection:text-white">
      {/* 1. Global Apple-style Hairline Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-black/[0.08] dark:border-white/[0.12] transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <LogoMark size={26} />
            <span className="font-semibold tracking-[-0.03em] text-[15px] text-neutral-900 dark:text-white">
              VOYAGE
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium tracking-tight text-neutral-600 dark:text-neutral-400">
            <a href="#overview" className="hover:text-black dark:hover:text-white transition-colors">
              Overview
            </a>
            <a href="#breakthroughs" className="hover:text-black dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#azure" className="hover:text-black dark:hover:text-white transition-colors">
              Cloud Infrastructure
            </a>
            <a href="#workflow" className="hover:text-black dark:hover:text-white transition-colors">
              Driver Pass
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/overview"
              className="text-[13px] font-medium px-4 py-1.5 rounded-full bg-[#0071E3] text-white hover:bg-[#0077ED] transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_12px_rgba(0,113,227,0.35)]"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Chapter: The Hook */}
      <section id="overview" className="pt-24 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/60 dark:bg-white/[0.06] text-[12px] font-medium text-neutral-600 dark:text-neutral-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          The Freight Operating System for Indian & Global Road Fleets
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-neutral-900 dark:text-white max-w-4xl mx-auto leading-[1.08]">
          Logistics runs on chaos. <br />
          <span className="bg-gradient-to-r from-[#0071E3] via-[#2997FF] to-[#0071E3] bg-clip-text text-transparent">
            VOYAGE runs on certainty.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
          Eliminate the 50 daily calls to drivers. Preempt delayed delivery penalties, coordinate fleets with zero-install WhatsApp passes, and settle invoices with instant camera proof-of-delivery.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/overview"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-medium text-[15px] hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 dark:shadow-white/10"
          >
            Launch Live Operations
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/driver-pass"
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-black/[0.12] dark:border-white/[0.16] bg-white dark:bg-neutral-900 font-medium text-[15px] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-neutral-800 dark:text-neutral-200"
          >
            <Smartphone className="w-4 h-4 text-[#0071E3]" />
            Preview Driver Mobile Pass
          </Link>
        </div>

        {/* High-Density macOS Precision Window Mockup */}
        <div className="mt-16 relative mx-auto rounded-2xl border border-black/[0.10] dark:border-white/[0.14] bg-white dark:bg-[#1C1C1E] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.20)] dark:shadow-[0_32px_96px_-24px_rgba(0,0,0,0.80)] overflow-hidden">
          {/* macOS Window Title Bar */}
          <div className="h-10 px-4 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-neutral-50/80 dark:bg-neutral-900/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              <span className="ml-3 text-[11px] font-mono text-neutral-500 tracking-tight">
                voyage-dispatch-console — 42 Active Road Trips
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Telemetry
            </div>
          </div>

          {/* Interactive Console Visual */}
          <div className="p-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                <span className="text-[11px] uppercase font-mono text-neutral-500">Active Shipments</span>
                <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">42 In-Transit</p>
                <span className="text-[12px] text-emerald-600 font-medium">94.8% SLA on-track</span>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                <span className="text-[11px] uppercase font-mono text-amber-600 dark:text-amber-400">At-Risk Exceptions</span>
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">2 Urgent</p>
                <span className="text-[12px] text-neutral-500 font-medium">Action required within 45m</span>
              </div>
              <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                <span className="text-[11px] uppercase font-mono text-neutral-500">Average Dock Wait</span>
                <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">32 Minutes</p>
                <span className="text-[12px] text-emerald-600 font-medium">-18m vs yesterday</span>
              </div>
              <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F9F9FB] dark:bg-neutral-900/50">
                <span className="text-[11px] uppercase font-mono text-neutral-500">Digital PODs Verified</span>
                <p className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">100% Signed</p>
                <span className="text-[12px] text-blue-600 font-medium">Zero paper lost</span>
              </div>
            </div>

            {/* Micro Exception Queue */}
            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.10] overflow-hidden">
              <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-2.5 text-[12px] font-medium text-neutral-500 flex justify-between">
                <span>PRIORITY DISPATCH EXCEPTION QUEUE</span>
                <span>REAL-TIME CORRIDOR TELEMETRY</span>
              </div>
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] text-[13px]">
                <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-600 border border-red-500/20 font-semibold">
                      CRITICAL
                    </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-white">#TRP-DEL-MUM-892</span>
                    <span className="text-neutral-500">Delhi-NCR → Bhiwandi Hub (MH-04-AB-1234)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">Stationary &gt;48m near Gurgaon Toll</span>
                    <Link href="/overview" className="text-[12px] font-semibold text-[#0071E3] hover:underline flex items-center gap-1">
                      Resolve <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20 font-semibold">
                      WARNING
                    </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-white">#TRP-BLR-HYD-401</span>
                    <span className="text-neutral-500">Bengaluru → Hyderabad Depot (KA-01-MJ-9920)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">E-Way Bill expires in 3h 15m</span>
                    <Link href="/overview" className="text-[12px] font-semibold text-[#0071E3] hover:underline flex items-center gap-1">
                      Extend <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bento Grid: The 3 Operational Breakthroughs */}
      <section id="breakthroughs" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Engineered for physical reality.
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400 text-base">
            No 3D gimmicks, no fake predictions. Just the exact tools needed to get cargo delivered on time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Zero-Install Driver Pass */}
          <div className="p-7 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1C1C1E] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center mb-5">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                Zero-Install Driver Pass
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Drivers will not install a 50MB app. A 1-click WhatsApp link opens directly in mobile Chrome to stream GPS coordinates and receive route directions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[12px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ 100% Driver Adoption Guaranteed
              </span>
            </div>
          </div>

          {/* Card 2: Exception Nerve Center */}
          <div className="p-7 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1C1C1E] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                The Exception Nerve Center
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Stop watching 200 green dots on a map. VOYAGE surfaces only the 3 trucks facing real delays, fuel halts, or E-Way Bill expiries so you resolve them in seconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[12px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                ✓ Preempt SLA Penalties Before Breach
              </span>
            </div>
          </div>

          {/* Card 3: Instant Camera Proof-of-Delivery */}
          <div className="p-7 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1C1C1E] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                Instant Camera Bilti / POD
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Driver photographs the physical stamped challan at the dock. Recipient validates with a 4-digit OTP. Verified POD is stored securely in Azure Blob Storage.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              <span className="text-[12px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                ✓ Settle Freight Invoices 14 Days Faster
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Microsoft Azure Cloud Power */}
      <section id="azure" className="py-20 px-6 max-w-6xl mx-auto border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="p-8 sm:p-12 rounded-3xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#161618] relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-[11px] font-mono text-[#0071E3] dark:text-[#2997FF] mb-4">
              <Cloud className="w-3.5 h-3.5" /> ENTERPRISE CLOUD INFRASTRUCTURE
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Vercel Edge Speed. <br />
              Microsoft Azure Reliability.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              While Vercel delivers sub-second global UI responses, Microsoft Azure powers the high-volume operational core: private Azure Blob Storage for immutable Proof-of-Delivery documents, Azure IoT Hub for commercial GPS pings, and Azure Synapse / Fabric for deep fleet detention analytics.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-left">
              <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">99.99%</span>
                <p className="text-xs text-neutral-500 mt-0.5">SLA Uptime Commitment</p>
              </div>
              <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">Zero-Leak</span>
                <p className="text-xs text-neutral-500 mt-0.5">Private SAS Blob Vault</p>
              </div>
              <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">Power BI</span>
                <p className="text-xs text-neutral-500 mt-0.5">1-Click DirectQuery Export</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Driver Pass Workflow Showcase */}
      <section id="workflow" className="py-20 px-6 max-w-5xl mx-auto text-center border-t border-black/[0.08] dark:border-white/[0.10]">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          A 4-step loop that clears the road.
        </h2>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-4 gap-6 text-left">
          <div className="p-5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]">
            <span className="text-[11px] font-mono text-[#0071E3] font-semibold">STEP 01</span>
            <h4 className="font-semibold text-sm mt-2 text-neutral-900 dark:text-white">Dispatch Trip</h4>
            <p className="text-xs text-neutral-500 mt-1">Assign truck, driver phone, and delivery deadline in 20 seconds.</p>
          </div>
          <div className="p-5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]">
            <span className="text-[11px] font-mono text-[#0071E3] font-semibold">STEP 02</span>
            <h4 className="font-semibold text-sm mt-2 text-neutral-900 dark:text-white">WhatsApp Pass</h4>
            <p className="text-xs text-neutral-500 mt-1">Driver opens 1-click web link in mobile browser. GPS streams automatically.</p>
          </div>
          <div className="p-5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]">
            <span className="text-[11px] font-mono text-[#0071E3] font-semibold">STEP 03</span>
            <h4 className="font-semibold text-sm mt-2 text-neutral-900 dark:text-white">Live Client Track</h4>
            <p className="text-xs text-neutral-500 mt-1">Share a live tracking link with the consignor so they never have to call.</p>
          </div>
          <div className="p-5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">STEP 04</span>
            <h4 className="font-semibold text-sm mt-2 text-neutral-900 dark:text-white">OTP &amp; Photo POD</h4>
            <p className="text-xs text-neutral-500 mt-1">Consignee gives 4-digit OTP. Driver snaps bilti photo. Settlement complete.</p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-24 px-6 text-center bg-white dark:bg-[#0A0A0C] border-t border-black/[0.08] dark:border-white/[0.10]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Ready to give your freight operations certainty?
          </h2>
          <p className="mt-4 text-base text-neutral-600 dark:text-neutral-400">
            Open the live console now to test real dispatch workflows, manage vehicles, and experience the zero-install driver pass.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/overview"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-[15px] transition-all shadow-[0_4px_16px_rgba(0,113,227,0.30)]"
            >
              Enter VOYAGE Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Apple Minimalist Footer */}
      <footer className="py-10 px-6 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-black text-[12px] text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">VOYAGE</span>
            <span>— The Freight Operating System</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/overview" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Console</Link>
            <Link href="/driver-pass" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Driver Pass</Link>
            <Link href="/login" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
