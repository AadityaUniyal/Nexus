"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sliders, Shield, Sparkles, CheckCircle2, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = React.useState("NEXUS Central Operations Hub");
  const [refreshRate, setRefreshRate] = React.useState("5");
  const [autoSimulate, setAutoSimulate] = React.useState(true);
  const [groqEnabled, setGroqEnabled] = React.useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings Saved",
      message: "Workspace preferences synchronized.",
      type: "success",
    });
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
            <span>Workspace Preferences</span>
            <span>·</span>
            <span>Governance & Telemetry Config</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
            System & Workspace Settings
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Telemetry Ingestion & Refresh Policy</CardTitle>
              <CardDescription>Configure IoT polling and spatial update intervals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Workspace Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />

              <Select
                label="Live Telemetry Stream Refresh Interval"
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                options={[
                  { label: "Real-time (5 seconds)", value: "5" },
                  { label: "Standard (15 seconds)", value: "15" },
                  { label: "Low-Bandwidth (60 seconds)", value: "60" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI & Simulation Engine Automation</CardTitle>
              <CardDescription>Manage Groq LLaMA 3.3 and deterministic auto-evaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-nexus-on-surface">Auto-trigger What-If Simulations</p>
                  <p className="text-[11px] text-nexus-on-surface-variant">
                    Automatically run deterministic reroute scenarios when critical incidents occur.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSimulate}
                  onChange={(e) => setAutoSimulate(e.target.checked)}
                  className="h-4 w-4 rounded accent-nexus-secondary cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-nexus-surface-container/60 border border-nexus-outline-variant/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-nexus-on-surface">Groq AI Operational Synthesis</p>
                  <p className="text-[11px] text-nexus-on-surface-variant">
                    Use Groq LLaMA 3.3 70B for executive situational briefings and incident post-mortems.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={groqEnabled}
                  onChange={(e) => setGroqEnabled(e.target.checked)}
                  className="h-4 w-4 rounded accent-purple-600 cursor-pointer"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" variant="primary" className="font-mono-data text-xs shadow-tactile">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
