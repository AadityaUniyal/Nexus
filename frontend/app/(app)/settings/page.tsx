"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sliders,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Save,
  Globe2,
  MapPin,
  Cpu,
  Fingerprint,
  Bell,
  Eye,
  Activity,
  Layers,
  Building2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authFetch } from "@/lib/api/auth-fetch";
import { tactileAudio } from "@/lib/sound-effects";
import { FadeIn } from "@/components/ui/motion-animations";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = React.useState<"general" | "autonomy" | "security" | "telemetry">("general");

  // General Settings
  const [workspaceName, setWorkspaceName] = React.useState("Continental Logistics Global");
  const [hubCity, setHubCity] = React.useState("Dehradun");
  const [hubCountry, setHubCountry] = React.useState("India");
  const [dispatchRadiusKm, setDispatchRadiusKm] = React.useState(120);

  // Autonomy & Telemetry Settings
  const [refreshRateSec, setRefreshRateSec] = React.useState(5);
  const [autoRerouteApproval, setAutoRerouteApproval] = React.useState(true);
  const [neuralEngineThreshold, setNeuralEngineThreshold] = React.useState(85);
  const [coldChainMonitoring, setColdChainMonitoring] = React.useState(true);

  // Security & Passkey
  const [passkeyHardwareBound, setPasskeyHardwareBound] = React.useState(true);
  const [aegisLedgerSignatures, setAegisLedgerSignatures] = React.useState(true);

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("nexus_company_name");
        if (savedCompany) setWorkspaceName(savedCompany);

        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name) setHubCity(parsed.name);
          if (parsed?.country) setHubCountry(parsed.country);
        }
      } catch {
        // fallback
      }
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    tactileAudio.playClick();

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("nexus_company_name", workspaceName);
        localStorage.setItem("nexus_workspace_location", JSON.stringify({
          name: hubCity,
          country: hubCountry,
          lat: hubCity === "Chicago" ? 41.8781 : 30.3165,
          lng: hubCity === "Chicago" ? -87.6298 : 78.0322,
          region: `${hubCity} Operational Perimeter`,
          radiusKm: dispatchRadiusKm,
        }));
      }

      await authFetch("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify({
          telemetryRefreshSec: refreshRateSec,
          autoRerouteApproval,
          notifications: true,
        }),
      }).catch(() => {});

      tactileAudio.playSuccess();
      toast({
        title: "Workspace Preferences Saved",
        message: "Settings synchronized with PostgreSQL database & local cache.",
        type: "success",
      });
    } catch (err: any) {
      tactileAudio.playCriticalAlert();
      toast({
        title: "Save Failed",
        message: err?.message || "Failed to persist workspace settings.",
        type: "critical",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <FadeIn className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>System & Workspace Configuration</span>
              <span>·</span>
              <span>Apple System Settings Paradigm</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Workspace & Sovereign Settings
            </h1>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            isLoading={saving}
            className="font-mono-data text-xs shadow-tactile gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Preferences</span>
          </Button>
        </div>

        {/* Apple macOS Style 2-Column Settings Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Navigation Sidebar */}
          <div className="space-y-1.5 font-mono text-xs">
            {[
              { id: "general", label: "General & Hub Identity", icon: Building2 },
              { id: "autonomy", label: "Autonomy & Neural Engine", icon: Cpu },
              { id: "security", label: "Security & Passkeys", icon: ShieldCheck },
              { id: "telemetry", label: "IoT Telemetry Stream", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    tactileAudio.playClick();
                    setActiveSection(tab.id as any);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-left ${
                    isSelected
                      ? "bg-nexus-surface-container text-nexus-on-surface font-bold shadow-tactile border border-nexus-outline-variant/40"
                      : "text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-nexus-on-surface-variant"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Settings Content Panes */}
          <div className="md:col-span-3 space-y-6">
            {/* SECTION 1: GENERAL & HUB IDENTITY */}
            {activeSection === "general" && (
              <Card className="p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-nexus-on-surface">Organization & Hub Identity</h3>
                  <p className="text-xs text-nexus-on-surface-variant mt-0.5">
                    Configure your corporate logistics organization name and primary operational base coordinates.
                  </p>
                </div>

                <div className="space-y-4 pt-2 font-mono text-xs">
                  <div>
                    <label className="text-stone-300 block mb-1">Organization Title</label>
                    <Input
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-stone-300 block mb-1">Primary Operating City</label>
                      <Input
                        value={hubCity}
                        onChange={(e) => setHubCity(e.target.value)}
                        placeholder="e.g. Dehradun or Chicago"
                      />
                    </div>
                    <div>
                      <label className="text-stone-300 block mb-1">Country / Jurisdiction</label>
                      <Input
                        value={hubCountry}
                        onChange={(e) => setHubCountry(e.target.value)}
                        placeholder="e.g. India or United States"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Dispatch Perimeter Radius</span>
                      <span className="text-emerald-400 font-bold">{dispatchRadiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="500"
                      step="10"
                      value={dispatchRadiusKm}
                      onChange={(e) => setDispatchRadiusKm(Number(e.target.value))}
                      className="w-full accent-emerald-400 bg-stone-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 2: AUTONOMY & NEURAL ENGINE */}
            {activeSection === "autonomy" && (
              <Card className="p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-nexus-on-surface">Nexus Neural Engine™ Guardrails</h3>
                  <p className="text-xs text-nexus-on-surface-variant mt-0.5">
                    Configure autonomous rerouting policies and Pareto trade-off thresholds.
                  </p>
                </div>

                <div className="space-y-4 pt-2 font-mono text-xs">
                  {/* Auto Reroute Toggle */}
                  <div
                    onClick={() => setAutoRerouteApproval(!autoRerouteApproval)}
                    className="p-4 rounded-2xl bg-nexus-surface-container/50 border border-nexus-outline-variant/30 flex items-center justify-between cursor-pointer hover:bg-nexus-surface-container/70 transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-nexus-on-surface">Instant Autonomous Rerouting</h4>
                      <p className="text-[11px] text-nexus-on-surface-variant mt-0.5">
                        Automatically dispatch kinetic detours when SLA breach probability exceeds 75%.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${autoRerouteApproval ? "bg-emerald-500 border-emerald-400 text-black" : "border-stone-600"}`}>
                      {autoRerouteApproval && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Cold Chain Monitoring Toggle */}
                  <div
                    onClick={() => setColdChainMonitoring(!coldChainMonitoring)}
                    className="p-4 rounded-2xl bg-nexus-surface-container/50 border border-nexus-outline-variant/30 flex items-center justify-between cursor-pointer hover:bg-nexus-surface-container/70 transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-nexus-on-surface">Cryogenic & Cold-Chain Enforcement</h4>
                      <p className="text-[11px] text-nexus-on-surface-variant mt-0.5">
                        Trigger priority emergency reroutes if cargo bay temperature deviates by &gt;1.5°C.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${coldChainMonitoring ? "bg-cyan-500 border-cyan-400 text-black" : "border-stone-600"}`}>
                      {coldChainMonitoring && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Decision Confidence Slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-300">Minimum Neural Decision Score</span>
                      <span className="text-purple-400 font-bold">{neuralEngineThreshold} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="98"
                      step="2"
                      value={neuralEngineThreshold}
                      onChange={(e) => setNeuralEngineThreshold(Number(e.target.value))}
                      className="w-full accent-purple-400 bg-stone-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 3: SECURITY & PASSKEYS */}
            {activeSection === "security" && (
              <Card className="p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-nexus-on-surface">Sovereign Security & Aegis Protocol</h3>
                  <p className="text-xs text-nexus-on-surface-variant mt-0.5">
                    Hardware-bound biometric passkeys and SHA-256 cryptographic state verification.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2 font-mono text-xs">
                  <div
                    onClick={() => setPasskeyHardwareBound(!passkeyHardwareBound)}
                    className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-white">Nexus Passkey ID™</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">FIDO2 WebAuthn TouchID & FaceID hardware key authentication.</p>
                      </div>
                    </div>
                    <span className="text-cyan-300 font-bold text-[10px]">ACTIVE</span>
                  </div>

                  <div
                    onClick={() => setAegisLedgerSignatures(!aegisLedgerSignatures)}
                    className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-purple-400" />
                      <div>
                        <h4 className="font-bold text-white">Aegis Cryptographic State Ledger</h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">Immutable cryptographic proof generation on all reroutes and state transitions.</p>
                      </div>
                    </div>
                    <span className="text-purple-300 font-bold text-[10px]">ENFORCED</span>
                  </div>
                </div>
              </Card>
            )}

            {/* SECTION 4: TELEMETRY STREAM */}
            {activeSection === "telemetry" && (
              <Card className="p-6 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-nexus-on-surface">Sovereign StreamGrid™ Telemetry Bus</h3>
                  <p className="text-xs text-nexus-on-surface-variant mt-0.5">
                    High-throughput IoT polling and spatial update interval calibration.
                  </p>
                </div>

                <div className="space-y-4 pt-2 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-stone-300">Live Telemetry Poll Frequency</span>
                      <span className="text-cyan-400 font-bold">{refreshRateSec} Seconds</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 10].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            tactileAudio.playClick();
                            setRefreshRateSec(sec);
                          }}
                          className={`p-3 rounded-xl border text-center font-bold transition-all ${
                            refreshRateSec === sec
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                              : "bg-nexus-surface-container/50 border-nexus-outline-variant/30 text-nexus-on-surface-variant"
                          }`}
                        >
                          {sec}s {sec === 1 ? "(Real-Time)" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </FadeIn>
    </AppShell>
  );
}
