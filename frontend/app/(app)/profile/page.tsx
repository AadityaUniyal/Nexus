"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar3D } from "@/components/avatar/Avatar3D";
import { User, Shield, Activity, Clock, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-nexus-surface-lowest border border-nexus-outline-variant/40 shadow-tactile flex flex-col sm:flex-row items-center gap-6">
          <Avatar3D mood="WELCOME" size="lg" />
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-nexus-on-surface">Sarah Chen</h1>
              <Badge variant="healthy" size="sm">
                OPERATIONS_MANAGER
              </Badge>
            </div>
            <p className="text-xs text-nexus-on-surface-variant font-mono-data">sarah.chen@nexus.ops</p>
            <p className="text-xs text-nexus-on-surface-variant">
              Department: Fleet Command & Decision Dispatch
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assigned Operational Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono-data">
              <div className="p-3 rounded-lg bg-nexus-surface-container/60 flex justify-between">
                <span>Fleet Group:</span>
                <span className="font-semibold text-nexus-on-surface">Central & Southern Haulers (5 Units)</span>
              </div>
              <div className="p-3 rounded-lg bg-nexus-surface-container/60 flex justify-between">
                <span>Primary Hub:</span>
                <span className="font-semibold text-nexus-on-surface">WH-CHI (Chicago Hub)</span>
              </div>
              <div className="p-3 rounded-lg bg-nexus-surface-container/60 flex justify-between">
                <span>Active Incidents Lead:</span>
                <span className="font-semibold text-red-700">INC-8041 (I-80 Blizzard)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security & Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>RUN_SIMULATION (Hypothetical Branching)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>APPLY_DECISION (ACID Dispatch Mutation)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>RESOLVE_INCIDENT (Lifecycle Sign-off)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>VIEW_AUDIT_LOGS (Historical Compliance)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
