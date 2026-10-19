"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { FadeIn } from "@/components/motion";
import { ArrowRight, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <FadeIn className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-nexus-on-surface-variant">Administration</p>
          <h1 className="text-3xl font-semibold tracking-tight text-nexus-on-surface">Workspace governance</h1>
          <p className="max-w-2xl text-sm leading-6 text-nexus-on-surface-variant">Security policies and retention controls are not configurable in this deployment. No changes have been saved.</p>
        </header>

        <section className="rounded-2xl border border-nexus-outline-variant/50 bg-nexus-surface-container-low p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-nexus-surface-container p-3 text-nexus-on-surface-variant"><Shield className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-nexus-on-surface">{user?.workspace_name || "Your workspace"}</h2>
              <p className="mt-1 text-sm leading-6 text-nexus-on-surface-variant">This page previously displayed local-only security controls. Those controls have been removed until the service can enforce and persist them.</p>
              <Link href="/settings" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-nexus-primary hover:underline">
                Open available workspace settings <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>
    </AppShell>
  );
}
