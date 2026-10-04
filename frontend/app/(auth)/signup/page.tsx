"use client";

import * as React from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  Truck,
  Globe2,
  Sliders,
  CheckCircle2,
  Users,
  Sparkles,
  AlertTriangle,
  Compass,
} from "lucide-react";

export default function SignUpPage() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Step 1: Admin Credentials
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Step 2: Company Logistics Profile
  const [companyName, setCompanyName] = React.useState("");
  const [sector, setSector] = React.useState("Intermodal Freight & Cold-Chain");
  const [fleetSize, setFleetSize] = React.useState(75);
  const [region, setRegion] = React.useState("North America Central Corridor");
  const [targetSla, setTargetSla] = React.useState(98);

  // Step 3: Supervisor Hierarchy (Empty Defaults)
  const [regionalDirectorName, setRegionalDirectorName] = React.useState("");
  const [dispatchSupervisorName, setDispatchSupervisorName] = React.useState("");
  const [safetySpecialistName, setSafetySpecialistName] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all administrator credentials.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      setError("Please provide your company or organization name.");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const workspaceId = `ws-${(companyName || "company").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}`;
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

      // Attempt backend signup
      try {
        await fetch(`${baseUrl}/api/v1/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role: "ADMINISTRATOR",
            department: `${companyName || "Enterprise"} Executive Command`,
            workspace_id: workspaceId,
          }),
        });
      } catch {
        // Continue to provision in workspace
      }

      const user = {
        id: `usr-admin-${Date.now()}`,
        name,
        email,
        role: "ADMINISTRATOR",
        workspace_id: workspaceId,
      };

      const companyProfile = {
        companyName: companyName || "My Logistics Enterprise",
        sector,
        fleetSize: fleetSize || 75,
        region,
        targetSla: targetSla || 98,
        autoApproveReroutes: true,
        tempMonitoring: sector.includes("Cold-Chain") || sector.includes("Pharma"),
        evBatteryBufferPct: 20,
        driverMaxHours: 11,
        hazmatRestrictions: sector.includes("HAZMAT"),
        carbonTargetReductionPct: 15,
        supervisors: [
          { level: 1, role: "REGIONAL_DIRECTOR", title: "Regional Operations Director", name: regionalDirectorName, email: `regional.dir@${workspaceId}.com` },
          { level: 2, role: "DISPATCH_SUPERVISOR", title: "Fleet & Hub Dispatch Supervisor", name: dispatchSupervisorName, email: `dispatch.sup@${workspaceId}.com` },
          { level: 3, role: "SAFETY_SPECIALIST", title: "Field Safety & Incident Specialist", name: safetySpecialistName, email: `safety.spec@${workspaceId}.com` },
        ],
      };

      if (typeof window !== "undefined") {
        document.cookie = `nexus_demo_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem("nexus_active_workspace_id", user.workspace_id);
        localStorage.setItem("nexus_demo_user", JSON.stringify(user));
        localStorage.setItem("nexus_access_token", "demo-operator-token");
        localStorage.setItem("nexus_company_profile", JSON.stringify(companyProfile));
        localStorage.setItem("nexus_company_name", companyProfile.companyName);
        localStorage.setItem("nexus_company_sector", companyProfile.sector);
      }

      // Route directly to the Company Admin command center!
      window.location.href = "/admin/company";
    } catch (err: any) {
      setError(err?.message || "Network error occurred during provisioning.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <LogoMark size={34} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Company Onboarding Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span className="hidden sm:inline">Already registered?</span>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg border border-nexus-outline-variant/40 bg-nexus-surface-container/60 hover:bg-nexus-surface-container text-nexus-on-surface font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="mb-6 text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                Step {step} of 3: {step === 1 ? "Admin Identity" : step === 2 ? "Logistics Profile" : "Supervisor Hierarchy"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-nexus-on-surface">
              {step === 1
                ? "Provision Company Workspace"
                : step === 2
                ? "Configure Logistics Parameters"
                : "Assign 3-Tier Supervisor Team"}
            </h1>
            <p className="text-xs font-mono-data text-nexus-on-surface-variant max-w-md mx-auto">
              {step === 1
                ? "Register as your company's solo administrator to initialize a dedicated operational partition."
                : step === 2
                ? "Tailor the platform to your company's active fleet scale and industry dispatch rules."
                : "Configure the 3 supervisory tiers to manage regional corridors, vehicle dispatch, and road safety."}
            </p>
          </div>

          <div className="w-full bg-nexus-surface-lowest border border-nexus-outline-variant/40 rounded-3xl p-6 sm:p-8 shadow-tactile-lg space-y-5">
            {/* Step 1: Admin Identity */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Company Administrator Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-nexus-on-surface-variant" />
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 font-mono-data text-xs"
                      placeholder="Alex Rivera (COO)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Corporate Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-nexus-on-surface-variant" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 font-mono-data text-xs"
                      placeholder="alex.rivera@logistics-global.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Master Password Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-nexus-on-surface-variant" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 font-mono-data text-xs"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-rose-500 font-mono-data">{error}</p>}

                <Button type="submit" variant="primary" className="w-full py-2.5 font-mono-data text-xs font-semibold gap-2 shadow-tactile">
                  Continue to Logistics Setup <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {/* Step 2: Logistics Profile */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Company / Organization Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-nexus-on-surface-variant" />
                    <Input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-9 font-mono-data text-xs"
                      placeholder="e.g. Apex Freight Logistics"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Logistics Sector / Specialization
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-container/50 border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                  >
                    <option value="Intermodal Freight & Cold-Chain">Intermodal Freight &amp; Cold-Chain</option>
                    <option value="Last-Mile E-Commerce & Retail">Last-Mile E-Commerce &amp; Retail</option>
                    <option value="HAZMAT & Chemical Freight">HAZMAT &amp; Chemical Freight</option>
                    <option value="Automotive Just-In-Time Parts">Automotive Just-In-Time Parts</option>
                    <option value="Pharmaceutical Temperature Controlled">Pharmaceutical Temperature Controlled</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Fleet Scale (Trucks)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={2000}
                      value={fleetSize}
                      onChange={(e) => setFleetSize(parseInt(e.target.value) || 10)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-container/50 border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                      Target SLA (%)
                    </label>
                    <input
                      type="number"
                      min={80}
                      max={100}
                      value={targetSla}
                      onChange={(e) => setTargetSla(parseInt(e.target.value) || 95)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-container/50 border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1.5">
                    Primary Regional Network
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-nexus-surface-container/50 border border-nexus-outline-variant/50 text-xs font-mono-data text-nexus-on-surface focus:outline-none focus:ring-1 focus:ring-nexus-primary"
                  >
                    <option value="North America Central Corridor">North America Central Corridor (I-80 / I-70)</option>
                    <option value="East Coast Port & Rail Network">East Coast Port &amp; Rail Network</option>
                    <option value="Western Intermodal & Pacific Gateway">Western Intermodal &amp; Pacific Gateway</option>
                    <option value="European Continental Freight">European Continental Freight</option>
                  </select>
                </div>

                {error && <p className="text-xs text-rose-500 font-mono-data">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="font-mono text-xs"
                  >
                    ← Back
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 py-2.5 font-mono text-xs font-semibold gap-2 shadow-tactile"
                  >
                    Configure Supervisors <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Supervisor Hierarchy Provisioning */}
            {step === 3 && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-bold text-nexus-on-surface">Level 1: Regional Operations Director</span>
                      </div>
                      <Badge variant="healthy" size="sm">Hub Oversight</Badge>
                    </div>
                    <Input
                      type="text"
                      value={regionalDirectorName}
                      onChange={(e) => setRegionalDirectorName(e.target.value)}
                      className="font-mono-data text-xs"
                      placeholder="e.g. Sarah Chen"
                    />
                    <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                      Delegated multi-hub health oversight and critical disruption escalation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold text-nexus-on-surface">Level 2: Fleet & Hub Dispatch Supervisor</span>
                      </div>
                      <Badge variant="ai" size="sm">Active Rerouting</Badge>
                    </div>
                    <Input
                      type="text"
                      value={dispatchSupervisorName}
                      onChange={(e) => setDispatchSupervisorName(e.target.value)}
                      className="font-mono-data text-xs"
                      placeholder="e.g. David Kim"
                    />
                    <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                      Delegated live vehicle assignment, corridor rerouting, and detour simulation.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <span className="text-xs font-bold text-nexus-on-surface">Level 3: Field Safety & Incident Specialist</span>
                      </div>
                      <Badge variant="critical" size="sm">Hazard Mitigation</Badge>
                    </div>
                    <Input
                      type="text"
                      value={safetySpecialistName}
                      onChange={(e) => setSafetySpecialistName(e.target.value)}
                      className="font-mono-data text-xs"
                      placeholder="e.g. Elena Rostova"
                    />
                    <p className="text-[10px] text-nexus-on-surface-variant font-mono-data">
                      Delegated road hazard triage, reefer temperature monitoring, and safety response.
                    </p>
                  </div>
                </div>

                {error && <p className="text-xs text-rose-500 font-mono-data">{error}</p>}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="font-mono text-xs"
                  >
                    ← Back
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    className="flex-1 py-2.5 font-mono text-xs font-semibold gap-2 shadow-tactile"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Launch Company Command Center
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-nexus-on-surface-variant font-mono-data">
            Multi-tenant enterprise partition with ACID isolation &amp; Azure cloud encryption.
          </p>
        </div>
      </main>
    </div>
  );
}

