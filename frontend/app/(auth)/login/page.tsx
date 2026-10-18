"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Truck,
  Building2,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";

interface RolePreset {
  key: string;
  name: string;
  role: string;
  email: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESET_ACCOUNTS: RolePreset[] = [
  {
    key: "admin",
    name: "Alex Rivera",
    role: "ADMINISTRATOR",
    email: "admin@nexus.ops",
    title: "System Administrator",
    description: "Enterprise workspace governance, cloud telemetry bridges, and security ledger.",
    icon: ShieldCheck,
  },
  {
    key: "manager",
    name: "Sarah Chen",
    role: "OPERATIONS_MANAGER",
    email: "sarah.chen@nexus.ops",
    title: "Operations Manager",
    description: "Corridor disruption triage, incident response, and SLA penalty mitigation.",
    icon: Sparkles,
  },
  {
    key: "operator",
    name: "Elena Rostova",
    role: "OPERATOR",
    email: "elena.rostova@nexus.ops",
    title: "Fleet Operator",
    description: "Live commercial vehicle telemetry, driver dispatch, and terminal turnaround queues.",
    icon: Truck,
  },
  {
    key: "analyst",
    name: "Marcus Vance",
    role: "ANALYST",
    email: "marcus.vance@nexus.ops",
    title: "Supply Chain Analyst",
    description: "Monte Carlo stochastic simulations, weather modeling, and dataset exports.",
    icon: Layers,
  },
];

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/overview";
  const initialRole = searchParams.get("role") || "";

  const [email, setEmail] = React.useState("admin@nexus.ops");
  const [password, setPassword] = React.useState("nexus-demo-password");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedPreset, setSelectedPreset] = React.useState<string>("admin");

  // Sync initial role query parameter if provided
  React.useEffect(() => {
    if (initialRole) {
      const matched = PRESET_ACCOUNTS.find(
        (p) => p.role.toLowerCase() === initialRole.toLowerCase() || p.title.toLowerCase().includes(initialRole.toLowerCase())
      );
      if (matched) {
        setSelectedPreset(matched.key);
        setEmail(matched.email);
        setPassword("nexus-demo-password");
      }
    }
  }, [initialRole]);

  const handleSelectPreset = (preset: RolePreset) => {
    setSelectedPreset(preset.key);
    setEmail(preset.email);
    setPassword("nexus-demo-password");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const resp = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const user = data.user;
        const token = data.access_token;

        if (!token) {
          throw new Error("Authentication response did not contain access token.");
        }

        // 1. Establish verified session cookie
        const isSecure = window.location.protocol === "https:";
        document.cookie = `nexus_session_token=${token}; path=/; max-age=86400; SameSite=Lax${isSecure ? "; Secure" : ""}`;

        // 2. Persist authoritative token and workspace context in client storage
        localStorage.setItem("nexus_access_token", token);
        if (user) {
          localStorage.setItem("nexus_active_workspace_id", user.workspace_id || "ws-continental-fleet-01");
          localStorage.setItem("nexus_demo_user", JSON.stringify(user));
          localStorage.setItem("nexus_user_role", user.role);
        }

        // 3. Safe redirect validation (prevent open redirect attacks)
        let destination = "/overview";
        if (redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")) {
          destination = redirectTarget;
        } else if (user?.role === "ADMINISTRATOR") {
          destination = "/admin/company";
        }

        window.location.href = destination;
      } else {
        const errJson = await resp.json().catch(() => ({}));
        setError(errJson.detail || errJson.message || "Invalid credentials. Please verify your email and password.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach authentication gateway. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      {/* Editorial Header */}
      <div className="mb-8 text-center space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-surface-container border border-nexus-outline-variant/40 text-nexus-on-surface-variant text-xs font-mono font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Nexus Logistics Command Gateway</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-nexus-on-surface">
          Sign In to Your Workspace
        </h1>
        <p className="text-xs sm:text-sm text-nexus-on-surface-variant font-mono leading-relaxed">
          Authenticate using verified enterprise credentials or select an operational role identity below.
        </p>
      </div>

      {/* Main Authentication Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 bg-nexus-surface-lowest border border-nexus-outline-variant/35 rounded-3xl p-6 sm:p-10 shadow-tactile-lg">
        {/* Left 7 Columns: Verified Persona Quick-Fill */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-nexus-outline-variant/25">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
              1. Role Identity Presets
            </span>
            <span className="text-[11px] font-mono text-nexus-secondary font-semibold">
              Pre-Seeded Credentials
            </span>
          </div>

          <div className="space-y-2.5">
            {PRESET_ACCOUNTS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.key;
              return (
                <div
                  key={preset.key}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? "border-nexus-primary bg-nexus-primary/5 shadow-tactile ring-1 ring-nexus-primary/30"
                      : "border-nexus-outline-variant/30 bg-nexus-surface-container/20 hover:bg-nexus-surface-container/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-nexus-primary text-white shadow-xs"
                          : "bg-nexus-surface-container text-nexus-on-surface-variant"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-nexus-on-surface">{preset.name}</span>
                        <Badge variant={isSelected ? "simulation" : "neutral"} size="sm">
                          {preset.title}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-nexus-secondary font-medium">
                        {preset.email}
                      </p>
                      <p className="text-[11px] text-nexus-on-surface-variant font-mono leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(preset);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 self-end sm:self-center ${
                      isSelected
                        ? "bg-nexus-primary text-white shadow-tactile"
                        : "bg-nexus-surface-container hover:bg-nexus-surface-container-high text-nexus-on-surface"
                    }`}
                  >
                    <span>Select</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Authoritative Authentication Form */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-nexus-outline-variant/25 pt-6 lg:pt-0 lg:pl-8 space-y-6">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-nexus-outline-variant/25 mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-nexus-on-surface">
                2. Authenticate
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                TLS Encrypted
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-mono font-semibold text-nexus-on-surface mb-1.5"
                >
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-nexus-on-surface-variant pointer-events-none" />
                  <Input
                    id="email-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 font-mono text-xs h-9.5 rounded-xl"
                    placeholder="operator@nexus.ops"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-mono font-semibold text-nexus-on-surface"
                  >
                    Security Key
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-mono text-nexus-secondary hover:underline"
                  >
                    Forgot key?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nexus-on-surface-variant pointer-events-none" />
                  <Input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 font-mono text-xs h-9.5 rounded-xl"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-2.5 text-nexus-on-surface-variant hover:text-nexus-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-mono flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-2.5 font-mono text-xs font-bold shadow-tactile gap-2 rounded-xl mt-2"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

          <div className="p-3.5 rounded-2xl bg-nexus-surface-container/30 border border-nexus-outline-variant/20 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-nexus-on-surface font-mono">
              <Shield className="h-3.5 w-3.5 text-nexus-secondary" />
              Role Authorization Active
            </div>
            <p className="text-[10px] text-nexus-on-surface-variant font-mono leading-relaxed">
              Session is cryptographically signed and bound to your tenant workspace partition.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 w-full text-xs font-mono text-nexus-on-surface-variant px-2">
        <Link href="/" className="hover:text-nexus-on-surface transition-colors">
          ← Return to Public Network Story
        </Link>
        <div className="flex items-center gap-4">
          <span>Need a company partition?</span>
          <Link
            href="/signup"
            className="font-bold text-nexus-secondary hover:underline"
          >
            Register Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-nexus-surface text-nexus-on-surface flex flex-col selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
      {/* Top Header */}
      <header className="h-16 border-b border-nexus-outline-variant/30 bg-nexus-surface/85 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <LogoMark size={32} />
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-nexus-on-surface">Nexus</span>
            <span className="text-xs font-mono text-nexus-on-surface-variant font-medium hidden sm:inline">
              Command Gateway
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono text-nexus-on-surface-variant">
          <Link
            href="/status"
            className="hidden sm:flex items-center gap-1.5 hover:text-nexus-on-surface transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Systems Normal</span>
          </Link>
          <Link
            href="/signup"
            className="px-3.5 py-1.5 rounded-xl border border-nexus-outline-variant/40 bg-nexus-surface-container/60 hover:bg-nexus-surface-container text-nexus-on-surface font-semibold transition-colors"
          >
            New Workspace
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <React.Suspense fallback={<div className="font-mono text-xs text-nexus-on-surface-variant">Loading command gateway...</div>}>
          <LoginFormContent />
        </React.Suspense>
      </main>
    </div>
  );
}
