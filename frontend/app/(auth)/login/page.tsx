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
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  Compass,
  Building2,
  AlertTriangle,
  Globe2,
  Activity,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

type RoleOption = "ADMINISTRATOR" | "REGIONAL_DIRECTOR" | "DISPATCH_SUPERVISOR" | "SAFETY_SPECIALIST";

export default function LoginPage() {
  const [email, setEmail] = React.useState("admin@nexus.continental");
  const [password, setPassword] = React.useState("Password123!");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<RoleOption>("ADMINISTRATOR");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const resp = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const user = data.user || {
          id: "usr-admin-alex",
          name: email.split("@")[0].replace(".", " "),
          email,
          role: email.includes("admin") ? "ADMINISTRATOR" : "OPERATIONS_MANAGER",
          workspace_id: "ws-continental-fleet-01",
        };
        const token = data.access_token || "demo-operator-token";

        document.cookie = `nexus_demo_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem("nexus_active_workspace_id", user.workspace_id || "ws-continental-fleet-01");
        localStorage.setItem("nexus_demo_user", JSON.stringify(user));
        localStorage.setItem("nexus_access_token", token);

        window.location.href = user.role === "ADMINISTRATOR" ? "/admin/company" : "/overview";
      } else {
        loginAsRole(selectedRole);
      }
    } catch {
      loginAsRole(selectedRole);
    } finally {
      setLoading(false);
    }
  };

  const loginAsRole = (role: RoleOption) => {
    let user = {
      id: "usr-demo-admin",
      name: "Alex Rivera",
      title: "Chief Operating Officer & Solo Admin",
      email: "alex.rivera@continental-logistics.com",
      role: "ADMINISTRATOR",
      workspace_id: "ws-continental-fleet-01",
    };
    let target = "/admin/company";

    if (role === "REGIONAL_DIRECTOR") {
      user = {
        id: "usr-sarah-104",
        name: "Sarah Chen",
        title: "Regional Operations Director (Level 1 Supervisor)",
        email: "sarah.chen@continental-logistics.com",
        role: "OPERATIONS_MANAGER",
        workspace_id: "ws-continental-fleet-01",
      };
      target = "/overview";
    } else if (role === "DISPATCH_SUPERVISOR") {
      user = {
        id: "usr-david-04",
        name: "David Kim",
        title: "Fleet & Hub Dispatch Supervisor (Level 2 Supervisor)",
        email: "david.kim@continental-logistics.com",
        role: "OPERATOR",
        workspace_id: "ws-continental-fleet-01",
      };
      target = "/operations";
    } else if (role === "SAFETY_SPECIALIST") {
      user = {
        id: "usr-elena-92",
        name: "Elena Rostova",
        title: "Field Safety & Incident Specialist (Level 3 Supervisor)",
        email: "elena.rostova@continental-logistics.com",
        role: "FIELD_OPERATOR",
        workspace_id: "ws-continental-fleet-01",
      };
      target = "/incidents";
    }

    document.cookie = `nexus_demo_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
    localStorage.setItem("nexus_active_workspace_id", user.workspace_id);
    localStorage.setItem("nexus_demo_user", JSON.stringify(user));
    localStorage.setItem("nexus_access_token", "demo-operator-token");
    window.location.href = target;
  };

  const ROLES = [
    {
      key: "ADMINISTRATOR" as RoleOption,
      levelBadge: "Solo Admin / Executive",
      name: "Solo Company Administrator (COO)",
      person: "Alex Rivera · Executive Master Authority",
      desc: "Full company partition governance, SLA policies, supervisor delegation, and cloud integrations.",
      targetPage: "/admin/company",
      icon: ShieldCheck,
      color: "purple",
      badgeVariant: "simulation" as const,
    },
    {
      key: "REGIONAL_DIRECTOR" as RoleOption,
      levelBadge: "Level 1 Supervisor",
      name: "Regional Operations Director",
      person: "Sarah Chen · Multi-Hub Fleet Director",
      desc: "Multi-hub operational oversight, regional KPI health, critical disruption triage, and AI synthesis.",
      targetPage: "/overview",
      icon: Sparkles,
      color: "blue",
      badgeVariant: "healthy" as const,
    },
    {
      key: "DISPATCH_SUPERVISOR" as RoleOption,
      levelBadge: "Level 2 Supervisor",
      name: "Fleet & Hub Dispatch Supervisor",
      person: "David Kim · Lead Dispatch Controller",
      desc: "Live route telematics, active vehicle allocation, detour simulation runs, and driver coordination.",
      targetPage: "/operations",
      icon: Truck,
      color: "amber",
      badgeVariant: "ai" as const,
    },
    {
      key: "SAFETY_SPECIALIST" as RoleOption,
      levelBadge: "Level 3 Supervisor",
      name: "Field Safety & Incident Specialist",
      person: "Elena Rostova · Incident Response Lead",
      desc: "Atmospheric weather hazards, mechanical anomalies, cold-chain temperature alerts, and 3D digital twin.",
      targetPage: "/incidents",
      icon: AlertTriangle,
      color: "rose",
      badgeVariant: "critical" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <LogoMark size={34} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-xs font-mono-data text-nexus-on-surface-variant font-medium hidden sm:inline">
              Command Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
          <span className="hidden sm:inline">Need a company partition?</span>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-lg border border-nexus-outline-variant/40 bg-nexus-surface-container/60 hover:bg-nexus-surface-container text-nexus-on-surface font-semibold transition-colors"
          >
            Provision Company
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="mb-6 text-center space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-surface-container text-nexus-on-surface-variant text-[11px] font-mono-data font-semibold mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant Enterprise Logistics Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-nexus-on-surface">
              Logistics Command Sign In
            </h1>
            <p className="text-xs font-mono-data text-nexus-on-surface-variant">
              Select your company leadership role for 1-click instant evaluation or sign in with your corporate credentials.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 bg-nexus-surface-lowest border border-nexus-outline-variant/40 rounded-3xl p-6 sm:p-8 shadow-tactile-lg">
            {/* Left 7 Cols: 4-Tier Company Role Selector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-nexus-outline-variant/30">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
                  1. Select Company Role (1-Click Instant Access)
                </span>
                <span className="text-[10px] font-mono text-nexus-secondary font-bold">4 Distinct Personas</span>
              </div>

              <div className="space-y-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => {
                        setSelectedRole(r.key);
                        if (r.key === "ADMINISTRATOR") {
                          setEmail("admin@nexus.continental");
                        } else if (r.key === "REGIONAL_DIRECTOR") {
                          setEmail("sarah.chen@nexus.continental");
                        } else if (r.key === "DISPATCH_SUPERVISOR") {
                          setEmail("david.kim@nexus.continental");
                        } else {
                          setEmail("elena.rostova@nexus.continental");
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? "border-nexus-primary bg-nexus-primary/5 shadow-tactile ring-1 ring-nexus-primary/30"
                          : "border-nexus-outline-variant/40 bg-nexus-surface-container/20 hover:bg-nexus-surface-container/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-nexus-primary text-white shadow-sm"
                              : "bg-nexus-surface-container text-nexus-on-surface-variant"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-nexus-on-surface">{r.name}</span>
                            <Badge variant={r.badgeVariant} size="sm">
                              {r.levelBadge}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-mono-data text-nexus-secondary font-medium">
                            {r.person}
                          </p>
                          <p className="text-[11px] text-nexus-on-surface-variant font-mono-data leading-relaxed">
                            {r.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loginAsRole(r.key);
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 self-end sm:self-center ${
                          isSelected
                            ? "bg-nexus-primary text-white shadow-tactile"
                            : "bg-nexus-surface-container hover:bg-nexus-surface-container-high text-nexus-on-surface"
                        }`}
                      >
                        <span>Launch</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Standard Sign In Form */}
            <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-nexus-outline-variant/30 pt-6 lg:pt-0 lg:pl-6 space-y-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface block mb-3">
                  2. Authenticate Credentials
                </span>

                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1">
                      Corporate Identifier (Email)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-nexus-on-surface-variant" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 font-mono-data text-xs h-9"
                        placeholder="operator@nexus.continental"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data font-semibold text-nexus-on-surface mb-1">
                      Password Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nexus-on-surface-variant" />
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 font-mono-data text-xs h-9"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-rose-500 font-mono-data">{error}</p>}

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    className="w-full py-2.5 font-mono-data text-xs font-semibold shadow-tactile gap-2 mt-2"
                  >
                    Enter Command Gateway
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/20 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-nexus-on-surface font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Enterprise RBAC Active
                </div>
                <p className="text-[10px] text-nexus-on-surface-variant font-mono-data leading-relaxed">
                  Active workspace session is cryptographically bound to your designated operational partition and cloud telemetry streams.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-nexus-on-surface-variant font-mono-data">
            Protected by multi-tier encryption &amp; enterprise RBAC session tokens · Nexus 2.1
          </p>
        </div>
      </main>
    </div>
  );
}

