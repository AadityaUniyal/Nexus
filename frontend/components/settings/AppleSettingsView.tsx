"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Building2,
  Sliders,
  Bell,
  ShieldCheck,
  HardDrive,
  Sparkles,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  Trash2,
  Upload,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  MapPin,
  Lock,
  Radio,
  SlidersHorizontal,
  Compass,
  Users,
  CreditCard,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/AuthProvider";

export type RoleType =
  | "OPERATIONS_MANAGER"
  | "OPERATOR"
  | "ANALYST"
  | "ADMINISTRATOR"
  | "VIEWER";

export function AppleSettingsView() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Active Category Navigation
  const [activeTab, setActiveTab] = React.useState<
    "account" | "appearance" | "notifications" | "team" | "billing" | "role" | "security" | "storage"
  >("account");

  // Account & Workspace
  const [workspaceName, setWorkspaceName] = React.useState("");
  const activeRole = (user?.role || "VIEWER") as RoleType;

  // Team & Invitations
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("OPERATOR");
  const [inviting, setInviting] = React.useState(false);
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = React.useState(false);

  // Commercial Billing & Fleet Tiers
  const [selectedPlan, setSelectedPlan] = React.useState<"STARTER" | "COMMERCIAL" | "ENTERPRISE">("COMMERCIAL");
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("monthly");

  // Appearance & Audio
  const [soundEffects, setSoundEffects] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);
  const [themeMode, setThemeMode] = React.useState<"dark" | "light" | "system">("dark");

  // Notifications (iOS Style)
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  // Operational Mode (Zero-State vs Sandbox)

  // Role-Specific Configurations
  // Manager
  const [autoRerouteThreshold, setAutoRerouteThreshold] = React.useState(85);
  const [maxBudgetCap, setMaxBudgetCap] = React.useState(5000);

  // Operator
  const [hudRefreshSec, setHudRefreshSec] = React.useState(2);
  const [nightModeHud, setNightModeHud] = React.useState(true);

  // Analyst
  const [monteCarloRuns, setMonteCarloRuns] = React.useState(5000);
  const [defaultExportFormat, setDefaultExportFormat] = React.useState("CSV");

  // Admin
  const [passkeyEnforced, setPasskeyEnforced] = React.useState(true);
  const [sessionTimeoutMins, setSessionTimeoutMins] = React.useState(30);

  // Viewer
  const [currencySymbol, setCurrencySymbol] = React.useState("USD ($)");
  const [digestTime, setDigestTime] = React.useState("08:00 AM EST");

  const [saving, setSaving] = React.useState(false);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);

  React.useEffect(() => { setWorkspaceName(user?.workspace_name || ""); }, [user?.workspace_name]);

  React.useEffect(() => {
    let active = true;
    fetch("/api/v1/settings", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Workspace preferences could not be loaded.");
        return response.json();
      })
      .then((settings) => {
        if (!active) return;
        if (settings.theme === "dark" || settings.theme === "light" || settings.theme === "system") setThemeMode(settings.theme);
        setNotificationsEnabled(Boolean(settings.notifications));
        if (Number.isFinite(settings.telemetryRefreshSec)) setHudRefreshSec(settings.telemetryRefreshSec);
        setSettingsError(null);
      })
      .catch((error) => { if (active) setSettingsError(error instanceof Error ? error.message : "Workspace preferences could not be loaded."); });
    return () => { active = false; };
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    tactileAudio.playClick();

    try {
      const response = await fetch("/api/v1/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeMode, notifications: notificationsEnabled, telemetryRefreshSec: hudRefreshSec }),
      });
      if (!response.ok) throw new Error("Settings service is unavailable.");
      tactileAudio.playSuccess();
      toast({ title: "Preferences saved", message: "The supported workspace settings were saved.", type: "success" });
    } catch (error) {
      toast({ title: "Could not save preferences", message: error instanceof Error ? error.message : "Settings service is unavailable.", type: "critical" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    tactileAudio.playClick();
    try {
      const res = await fetch("/api/v1/organizations/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        tactileAudio.playSuccess();
        const url = typeof window !== "undefined" ? `${window.location.origin}${data.inviteUrl}` : data.inviteUrl;
        setLastInviteUrl(url);
        setInviteEmail("");
        toast({
          title: "Invitation Generated",
          message: `Invite generated for ${data.email} as ${data.role}. Link ready to share.`,
          type: "success",
        });
      } else {
        throw new Error(data.detail || data.message || "Failed to create invite");
      }
    } catch (err: any) {
      toast({
        title: "Could not create invite",
        message: err.message || "Invitation failed",
        type: "critical",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCopyInvite = () => {
    if (!lastInviteUrl) return;
    navigator.clipboard.writeText(lastInviteUrl);
    setCopiedInvite(true);
    tactileAudio.playSuccess();
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const SECTIONS = [
    { id: "account", label: "Account & Tenancy", icon: User, badgeColor: "bg-blue-500" },
    { id: "team", label: "Team & Invites", icon: Users, badgeColor: "bg-emerald-500" },
    { id: "billing", label: "Billing & Fleet Tiers", icon: CreditCard, badgeColor: "bg-amber-500" },
    { id: "appearance", label: "Appearance & Haptics", icon: Sliders, badgeColor: "bg-purple-500" },
    { id: "notifications", label: "Push Notifications", icon: Bell, badgeColor: "bg-rose-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* iOS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
            <span>iOS System Preferences</span>
            <span>·</span>
            <span className="text-nexus-secondary font-bold">Workspace preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
            Settings
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveSettings}
            isLoading={saving}
            className="font-mono text-xs shadow-tactile"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
            Save Preferences
          </Button>
        </div>
      </div>

      {settingsError && <div role="alert" className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-3 text-xs">{settingsError} You can retry saving once the service is reachable.</div>}

      {/* Main iOS Grouped Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: iOS Sidebar Menu */}
        <div className="md:col-span-4 space-y-2">
          <div className="p-2 rounded-2xl bg-nexus-surface-container/90 border border-nexus-outline/30 shadow-tactile space-y-1">
            {SECTIONS.map((sec) => {
              const isActive = activeTab === sec.id;
              const Icon = sec.icon;

              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTab(sec.id as any);
                    tactileAudio.playClick();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-nexus-surface-container-highest border border-nexus-outline/40 shadow-xs font-bold text-nexus-on-surface"
                      : "text-nexus-on-surface-variant hover:text-nexus-on-surface hover:bg-nexus-surface-container-high/60 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg ${sec.badgeColor} text-white flex items-center justify-center shadow-xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono">{sec.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? "text-nexus-secondary translate-x-0.5" : "text-nexus-on-surface-variant/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: iOS Grouped Inset Panel */}
        <div className="md:col-span-8 space-y-4">
          {/* TAB 1: ACCOUNT & TENANCY */}
          {activeTab === "account" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold">
                    Workspace & Role Profile
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-tenant workspace identity and assigned role permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-nexus-on-surface-variant uppercase block mb-1">
                      Organization / Company Name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      readOnly
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-nexus-on-surface-variant uppercase block mb-1">
                      Active User Role Cockpit
                    </label>
                    <select
                      value={activeRole}
                      disabled
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    >
                      <option value={activeRole}>{activeRole.replaceAll("_", " ")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-nexus-on-surface-variant uppercase block mb-1">
                      Primary Operational Hub
                    </label>
                    <input
                      type="text"
                      value="Not configured"
                      readOnly
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB: TEAM & INVITATIONS */}
          {activeTab === "team" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Team Members & Invitations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Invite dispatchers, fleet operators, and analysts to your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  <form onSubmit={handleSendInvite} className="space-y-3 p-4 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div className="font-bold text-nexus-on-surface flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      Invite New Colleague
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <input
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          className="w-full p-2 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full p-2 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface"
                        >
                          <option value="OPERATOR">Fleet Operator</option>
                          <option value="OPERATIONS_MANAGER">Manager</option>
                          <option value="ANALYST">Analyst</option>
                          <option value="ADMINISTRATOR">Administrator</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={inviting || !inviteEmail.trim()}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs"
                        >
                          {inviting ? "Inviting..." : "Send Invite"}
                        </Button>
                      </div>
                    </div>

                    {lastInviteUrl && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2 mt-2">
                        <div className="truncate text-emerald-700 dark:text-emerald-300">
                          <span className="font-bold">Share Link:</span> {lastInviteUrl}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyInvite}
                          className="h-7 text-xs font-mono shrink-0"
                        >
                          {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedInvite ? "Copied" : "Copy Link"}
                        </Button>
                      </div>
                    )}
                  </form>

                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-neutral-500 uppercase">Active Workspace Members</div>
                    {[
                      { name: user?.name || "Primary Administrator", email: user?.email || "admin@nexus.fleet", role: activeRole, status: "ACTIVE" },
                      { name: "Sarah Jenkins", email: "s.jenkins@continental.fleet", role: "OPERATOR", status: "ACTIVE" },
                      { name: "Devin Reed", email: "d.reed@continental.fleet", role: "ANALYST", status: "INVITED" },
                    ].map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                        <div className="flex flex-col">
                          <span className="font-bold text-nexus-on-surface">{m.name}</span>
                          <span className="text-[10px] text-nexus-on-surface-variant">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">{m.role}</Badge>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${m.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"}`}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB: BILLING & FLEET TIERS */}
          {activeTab === "billing" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        Commercial Subscription & Fleet Allocation
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Per-vehicle tiered subscription and usage meters
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl font-mono text-[11px]">
                      <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-2.5 py-1 rounded-lg ${billingCycle === "monthly" ? "bg-white dark:bg-neutral-900 font-bold shadow-xs text-neutral-900 dark:text-white" : "text-neutral-500"}`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle("annual")}
                        className={`px-2.5 py-1 rounded-lg ${billingCycle === "annual" ? "bg-white dark:bg-neutral-900 font-bold shadow-xs text-neutral-900 dark:text-white" : "text-neutral-500"}`}
                      >
                        Annual (-20%)
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "STARTER", name: "Starter Fleet", price: billingCycle === "annual" ? "$39" : "$49", limit: "Up to 10 vehicles", features: ["Sub-second GPS Tracking", "Basic Exception Alerts", "Mobile Driver Pass"] },
                      { id: "COMMERCIAL", name: "Commercial Carrier", price: billingCycle === "annual" ? "$159" : "$199", limit: "Up to 50 vehicles", popular: true, features: ["Dynamic VRPTW Optimization", "Demurrage Dispute Ledger", "TreeSHAP SLA Attribution", "Diesel Siphon Detection"] },
                      { id: "ENTERPRISE", name: "Enterprise 3PL", price: billingCycle === "annual" ? "$399" : "$499", limit: "Unlimited vehicles", features: ["Physics-Informed ML (PINN)", "15,000+ Stream Buffer", "Dedicated VPC / Neon DB", "Custom EDI 204/214 Pipe"] }
                    ].map((plan) => {
                      const isCurrent = selectedPlan === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            setSelectedPlan(plan.id as any);
                            tactileAudio.playClick();
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            isCurrent
                              ? "bg-amber-500/[0.06] border-amber-500/50 shadow-tactile"
                              : "bg-nexus-surface border-nexus-outline/20 hover:border-nexus-outline/40"
                          }`}
                        >
                          {plan.popular && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black">
                              MOST POPULAR
                            </span>
                          )}
                          <div className="font-bold text-sm text-nexus-on-surface">{plan.name}</div>
                          <div className="mt-2 text-2xl font-black text-nexus-on-surface">
                            {plan.price}<span className="text-xs font-normal text-nexus-on-surface-variant">/mo</span>
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">{plan.limit}</div>
                          <ul className="mt-3 space-y-1.5 text-[11px] text-nexus-on-surface-variant">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4">
                            <Button
                              variant={isCurrent ? "default" : "outline"}
                              size="sm"
                              className={`w-full text-xs font-mono ${isCurrent ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                            >
                              {isCurrent ? "Current Plan ✓" : "Switch Plan"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Allocation Meter */}
                  <div className="p-4 rounded-xl bg-nexus-surface border border-nexus-outline/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-nexus-on-surface">Vehicle Telemetry Quota</span>
                      <span className="font-bold text-nexus-secondary">14 / 50 Active Commercial Trucks (28%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: "28%" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 2: APPEARANCE & HAPTICS */}
          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold">
                    Tactile Audio & Interface Polish
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure haptics, spring animations, and audio chimes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-nexus-on-surface">Tactile Audio Feedback</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Apple-style click and alert chimes on button interactions
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={(e) => {
                        setSoundEffects(e.target.checked);
                        tactileAudio.playClick();
                      }}
                      className="w-5 h-5 accent-nexus-secondary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-nexus-on-surface">Spring Animation Physics</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Cubic-bezier 60fps card hover lifts and page transitions
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={haptics}
                      onChange={(e) => {
                        setHaptics(e.target.checked);
                        tactileAudio.playClick();
                      }}
                      className="w-5 h-5 accent-nexus-secondary rounded cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold">
                    Workspace notifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    This preference controls whether workspace notifications are enabled.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-nexus-on-surface">Enable workspace notifications</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Notification delivery channels are controlled by workspace configuration.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: ROLE PREFERENCES */}
          {activeTab === "role" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-nexus-secondary" />
                      Role-Specific Settings ({activeRole})
                    </CardTitle>
                    <Badge variant="simulation" className="text-[10px] font-mono">
                      Dynamic
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Fine-tune granular behaviors engineered specifically for your role
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  {activeRole === "OPERATIONS_MANAGER" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                            Auto-Reroute Confidence Approval Threshold
                          </span>
                          <span className="font-bold text-nexus-on-surface">{autoRerouteThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={99}
                          value={autoRerouteThreshold}
                          onChange={(e) => setAutoRerouteThreshold(parseInt(e.target.value))}
                          className="w-full h-2 bg-nexus-surface-container-highest rounded-lg accent-nexus-secondary"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                            Max Auto-Authorize Budget Cap ($)
                          </span>
                          <span className="font-bold text-nexus-on-surface">${maxBudgetCap.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={25000}
                          step={500}
                          value={maxBudgetCap}
                          onChange={(e) => setMaxBudgetCap(parseInt(e.target.value))}
                          className="w-full h-2 bg-nexus-surface-container-highest rounded-lg accent-nexus-secondary"
                        />
                      </div>
                    </div>
                  )}

                  {activeRole === "OPERATOR" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                        <div>
                          <div className="font-bold text-nexus-on-surface">Field HUD Refresh Rate</div>
                          <div className="text-[10px] text-nexus-on-surface-variant">Telemetry polling interval</div>
                        </div>
                        <select
                          value={hudRefreshSec}
                          onChange={(e) => setHudRefreshSec(parseInt(e.target.value))}
                          className="p-1.5 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface"
                        >
                          <option value={1}>1 second (Realtime)</option>
                          <option value={2}>2 seconds (Standard)</option>
                          <option value={5}>5 seconds (Battery saver)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                        <div>
                          <div className="font-bold text-nexus-on-surface">High-Contrast Night Mode</div>
                          <div className="text-[10px] text-nexus-on-surface-variant">For low-light control rooms</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={nightModeHud}
                          onChange={(e) => setNightModeHud(e.target.checked)}
                          className="w-5 h-5 accent-nexus-secondary rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeRole === "ANALYST" && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-nexus-on-surface-variant uppercase text-[10px]">
                            Default Monte Carlo Simulation Runs
                          </span>
                          <span className="font-bold text-nexus-on-surface">{monteCarloRuns.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={10000}
                          step={1000}
                          value={monteCarloRuns}
                          onChange={(e) => setMonteCarloRuns(parseInt(e.target.value))}
                          className="w-full h-2 bg-nexus-surface-container-highest rounded-lg accent-nexus-secondary"
                        />
                      </div>
                    </div>
                  )}

                  {activeRole === "ADMINISTRATOR" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                        <div>
                          <div className="font-bold text-nexus-on-surface">Session Inactivity Lockout</div>
                          <div className="text-[10px] text-nexus-on-surface-variant">Automatic session lock timeout</div>
                        </div>
                        <select
                          value={sessionTimeoutMins}
                          onChange={(e) => setSessionTimeoutMins(parseInt(e.target.value))}
                          className="p-1.5 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeRole === "VIEWER" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                        <div>
                          <div className="font-bold text-nexus-on-surface">Reporting Currency Format</div>
                          <div className="text-[10px] text-nexus-on-surface-variant">Default display monetary unit</div>
                        </div>
                        <select
                          value={currencySymbol}
                          onChange={(e) => setCurrencySymbol(e.target.value)}
                          className="p-1.5 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface"
                        >
                          <option value="USD ($)">USD ($)</option>
                          <option value="EUR (€)">EUR (€)</option>
                          <option value="GBP (£)">GBP (£)</option>
                          <option value="INR (₹)">INR (₹)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 5: SECURITY & PASSKEYS */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-nexus-secondary" />
                    Biometric & Hardware Security
                  </CardTitle>
                  <CardDescription className="text-xs">
                    FIDO2 Passkeys, TouchID, and cryptographic signatures
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-nexus-on-surface">FIDO2 TouchID / Passkey</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Bound to hardware enclave on this device
                      </div>
                    </div>
                    <Badge variant="healthy">ENROLLED ✓</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* TAB 6: DATA & ZERO-STATE ENGINE */}
          {activeTab === "storage" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-nexus-outline/30 shadow-tactile">
                <CardHeader className="pb-3 border-b border-nexus-outline/20">
                  <CardTitle className="text-sm font-mono font-bold">
                    Operational data
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Workspace records are stored on the server. Connect an approved data source or add records from Operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  <p className="text-xs leading-5 text-nexus-on-surface-variant">Operational records are workspace data. Use the import workflow to add a real file; this page does not fabricate or locally reset records.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
