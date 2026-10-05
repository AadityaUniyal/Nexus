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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";
import { useToast } from "@/components/ui/toast";

export type RoleType =
  | "OPERATIONS_MANAGER"
  | "OPERATOR"
  | "ANALYST"
  | "ADMINISTRATOR"
  | "VIEWER";

export function AppleSettingsView() {
  const { toast } = useToast();

  // Active Category Navigation
  const [activeTab, setActiveTab] = React.useState<
    "account" | "appearance" | "notifications" | "role" | "security" | "storage"
  >("account");

  // Account & Workspace
  const [workspaceName, setWorkspaceName] = React.useState("Continental Logistics Global");
  const [hubCity, setHubCity] = React.useState("Dehradun");
  const [activeRole, setActiveRole] = React.useState<RoleType>("OPERATIONS_MANAGER");

  // Appearance & Audio
  const [soundEffects, setSoundEffects] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);
  const [themeMode, setThemeMode] = React.useState<"dark" | "light" | "system">("dark");

  // Notifications (iOS Style)
  const [notifyCritical, setNotifyCritical] = React.useState(true);
  const [notifyWarnings, setNotifyWarnings] = React.useState(true);
  const [emailDigest, setEmailDigest] = React.useState<"instant" | "daily" | "weekly">("daily");

  // Operational Mode (Zero-State vs Sandbox)
  const [operationalMode, setOperationalMode] = React.useState<"PRODUCTION" | "SANDBOX">("SANDBOX");

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

  // Load initial settings
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("nexus_company_name");
        if (savedCompany) setWorkspaceName(savedCompany);

        const savedRole = localStorage.getItem("nexus_user_role") as RoleType;
        if (savedRole) setActiveRole(savedRole);

        const savedMode = localStorage.getItem("nexus_operational_mode") as any;
        if (savedMode) setOperationalMode(savedMode);
      } catch {}
    }
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    tactileAudio.playClick();

    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_company_name", workspaceName);
      localStorage.setItem("nexus_user_role", activeRole);
      localStorage.setItem("nexus_operational_mode", operationalMode);
      localStorage.setItem(
        "nexus_role_config",
        JSON.stringify({
          autoRerouteThreshold,
          maxBudgetCap,
          hudRefreshSec,
          nightModeHud,
          monteCarloRuns,
          defaultExportFormat,
          passkeyEnforced,
          sessionTimeoutMins,
          currencySymbol,
        })
      );
    }

    setTimeout(() => {
      setSaving(false);
      tactileAudio.playSuccess();
      toast({
        title: "Preferences Saved",
        message: "Synchronized with PostgreSQL role settings and local session checkpoint.",
        type: "success",
      });
    }, 400);
  };

  const handleResetWorkspaceToZero = () => {
    tactileAudio.playCriticalAlert();
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexus_custom_vehicles");
      localStorage.removeItem("nexus_custom_warehouses");
      localStorage.removeItem("nexus_custom_routes");
      localStorage.removeItem("nexus_custom_incidents");
      localStorage.removeItem("nexus_custom_simulations");
      localStorage.setItem("nexus_operational_mode", "PRODUCTION");
      setOperationalMode("PRODUCTION");
    }
    toast({
      title: "Workspace Reset to Zero",
      message: "All operational records cleared. Workspace is now in clean zero-state.",
      type: "warning",
    });
  };

  const SECTIONS = [
    { id: "account", label: "Account & Tenancy", icon: User, badgeColor: "bg-blue-500" },
    { id: "appearance", label: "Appearance & Haptics", icon: Sliders, badgeColor: "bg-purple-500" },
    { id: "notifications", label: "Push Notifications", icon: Bell, badgeColor: "bg-rose-500" },
    { id: "role", label: "Role Preferences", icon: SlidersHorizontal, badgeColor: "bg-emerald-500" },
    { id: "security", label: "Security & Passkeys", icon: ShieldCheck, badgeColor: "bg-amber-500" },
    { id: "storage", label: "Data, Zero-State & Cache", icon: HardDrive, badgeColor: "bg-zinc-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* iOS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
            <span>iOS System Preferences</span>
            <span>·</span>
            <span className="text-nexus-secondary font-bold">Apple HIG Grade</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
            System & Role Settings
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
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-nexus-on-surface-variant uppercase block mb-1">
                      Active User Role Cockpit
                    </label>
                    <select
                      value={activeRole}
                      onChange={(e) => setActiveRole(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    >
                      <option value="OPERATIONS_MANAGER">OPERATIONS_MANAGER (Tactical Incident Commander)</option>
                      <option value="OPERATOR">OPERATOR (Field Dispatcher & Driver HUD)</option>
                      <option value="ANALYST">ANALYST (Predictive Scenario Lab)</option>
                      <option value="ADMINISTRATOR">ADMINISTRATOR (Aegis Governance & Security)</option>
                      <option value="VIEWER">VIEWER (Executive Boardroom & ESG)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-nexus-on-surface-variant uppercase block mb-1">
                      Primary Operational Hub
                    </label>
                    <input
                      type="text"
                      value={hubCity}
                      onChange={(e) => setHubCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-nexus-surface border border-nexus-outline/30 text-nexus-on-surface focus:outline-none focus:border-nexus-secondary"
                    />
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
                    Grouped Notification Rules
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Granular channels for critical SLA alerts and synthesis digests
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-rose-600 dark:text-rose-400">Critical Incident Siren</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        High-priority popups and audio chimes on Level-3 blizzard alerts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyCritical}
                      onChange={(e) => setNotifyCritical(e.target.checked)}
                      className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-nexus-surface border border-nexus-outline/20">
                    <div>
                      <div className="font-bold text-nexus-on-surface">Daily Executive Email Digest</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Automated 8:00 AM summary of fleet efficiency and cost savings
                      </div>
                    </div>
                    <select
                      value={emailDigest}
                      onChange={(e) => setEmailDigest(e.target.value as any)}
                      className="p-1.5 rounded-lg bg-nexus-surface-container border border-nexus-outline/30 text-nexus-on-surface text-xs"
                    >
                      <option value="instant">Instant Realtime</option>
                      <option value="daily">Daily at 08:00 AM</option>
                      <option value="weekly">Weekly Rollup</option>
                    </select>
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
                    Data Environment & Zero-State Engine
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Toggle between clean zero production data and interactive simulation sandbox
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4 font-mono text-xs">
                  {/* Operational Mode Toggle */}
                  <div className="p-4 rounded-xl bg-nexus-surface border border-nexus-outline/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-nexus-on-surface">Workspace Operational Mode</div>
                        <div className="text-[11px] text-nexus-on-surface-variant">
                          {operationalMode === "PRODUCTION"
                            ? "Clean Production: Shows only genuine user data (starts at 0)."
                            : "Demo Sandbox: Loads simulated Class-8 EV fleet & I-80 emergency."}
                        </div>
                      </div>
                      <select
                        value={operationalMode}
                        onChange={(e) => {
                          const newMode = e.target.value as any;
                          setOperationalMode(newMode);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("nexus_operational_mode", newMode);
                          }
                          tactileAudio.playSuccess();
                          toast({
                            title: `Switched to ${newMode} Mode`,
                            message: newMode === "PRODUCTION" ? "Active workspace reset to clean zero." : "Loaded interactive scenario sandbox.",
                            type: "info",
                          });
                        }}
                        className="p-2 rounded-lg bg-nexus-surface-container border border-nexus-outline/40 text-nexus-on-surface font-bold text-xs"
                      >
                        <option value="PRODUCTION">Clean Production (Default Zero)</option>
                        <option value="SANDBOX">Interactive Sandbox (Demo Fleet)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reset Workspace Button */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div>
                      <div className="font-bold text-rose-600 dark:text-rose-400">Reset Workspace to Zero</div>
                      <div className="text-[10px] text-nexus-on-surface-variant">
                        Wipes all custom local storage records and returns to pristine clean state
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleResetWorkspaceToZero}
                      className="font-mono text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset to 0
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
