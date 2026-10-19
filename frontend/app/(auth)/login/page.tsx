"use client";

import * as React from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { AppleAuthCard } from "@/components/auth/AppleAuthCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-[#0071E3] selection:text-white relative overflow-hidden">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#0071E3]/15 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Apple Minimalist Hairline Header */}
      <header className="w-full z-10 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-xl bg-white/40 dark:bg-black/40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <LogoMark size={24} />
            <span className="font-semibold tracking-[-0.03em] text-[14px] text-neutral-900 dark:text-white">
              VOYAGE
            </span>
          </Link>
          <Link
            href="/"
            className="text-[12px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ← Return to Overview
          </Link>
        </div>
      </header>

      {/* Authentication Center Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <React.Suspense fallback={<div className="h-96 w-full max-w-[440px] animate-pulse rounded-[28px] bg-black/5 dark:bg-white/5" />}>
          <AppleAuthCard />
        </React.Suspense>
      </main>

      {/* Apple Minimalist Footer */}
      <footer className="py-6 px-6 border-t border-black/[0.06] dark:border-white/[0.08] text-center text-[11px] text-neutral-400 z-10">
        <p>Copyright © 2026 VOYAGE Freight Operating System · Multi-Tenant Cloud Architecture</p>
      </footer>
    </div>
  );
}
