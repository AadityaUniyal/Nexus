"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  CheckCircle2,
  Lock,
  Mail,
  Loader2,
  Building2,
  Sparkles
} from "lucide-react";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000]" />}>
      <AppleStyleLoginContent />
    </React.Suspense>
  );
}

function AppleStyleLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/overview";
  const initialRole = searchParams.get("role") || "";

  // Progressive Apple ID Flow: Stage 1 = Email -> Stage 2 = Password
  const [stage, setStage] = React.useState<"email" | "password">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [transitionUser, setTransitionUser] = React.useState<any>(null);

  // Real enterprise operational identities in database
  const ENTERPRISE_PROFILES = [
    { label: "Operations Manager", name: "Marcus Vance", email: "marcus.vance@nexus.continental" },
    { label: "Fleet Operator", name: "David Kim", email: "david.kim@nexus.continental" },
    { label: "Supply Chain Analyst", name: "Elena Rostova", email: "elena.rostova@nexus.continental" },
    { label: "System Administrator", name: "Sarah Chen", email: "sarah.chen@nexus.continental" },
    { label: "Executive Viewer", name: "Audit Viewer", email: "audit.viewer@nexus.continental" },
  ];

  // Auto-fill from query param if provided
  React.useEffect(() => {
    if (initialRole) {
      const match = ENTERPRISE_PROFILES.find((a) =>
        a.label.toLowerCase().includes(initialRole.toLowerCase())
      );
      if (match) {
        setEmail(match.email);
        setPassword("Password123!");
      }
    }
  }, [initialRole]);

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid corporate email address.");
      return;
    }
    setError("");
    if (!password) {
      setPassword("Password123!");
    }
    setStage("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // In production and local, always use relative /api/v1 rewrite to guarantee seamless origin handling
      const resp = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const user = data.user;
        const token = data.access_token || data.accessToken;

        if (!token) {
          throw new Error("Authentication failed: No access token returned.");
        }

        const isSecure = window.location.protocol === "https:";
        document.cookie = `nexus_session_token=${token}; path=/; max-age=86400; SameSite=Lax${
          isSecure ? "; Secure" : ""
        }`;

        localStorage.setItem("nexus_access_token", token);
        if (user) {
          localStorage.setItem("nexus_active_workspace_id", user.workspace_id || user.workspaceId || "ws-continental-fleet-01");
          localStorage.setItem("nexus_demo_user", JSON.stringify(user));
          localStorage.setItem("nexus_user_role", user.role);
        }

        // Clear obsolete local mock storage so genuine database is single source of truth
        localStorage.removeItem("nexus_custom_vehicles");
        localStorage.removeItem("nexus_custom_warehouses");
        localStorage.removeItem("nexus_custom_orders");
        localStorage.removeItem("nexus_custom_routes");
        localStorage.removeItem("nexus_custom_incidents");

        let dest = "/overview";
        if (redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")) {
          dest = redirectTarget;
        } else if (user?.role === "ADMINISTRATOR") {
          dest = "/admin/company";
        }

        setTransitionUser(user);
        setIsTransitioning(true);
        router.prefetch(dest);

        setTimeout(() => {
          router.push(dest);
        }, 650);
      } else {
        const errJson = await resp.json().catch(() => ({}));
        setError(errJson.detail || errJson.message || "The corporate email or password you entered is incorrect.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach authentication service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col justify-between selection:bg-[#0071e3]/20 selection:text-[#0071e3] transition-colors duration-300">
      {/* Apple-style Global Nav */}
      <header className="h-12 w-full border-b border-black/[0.08] dark:border-white/[0.12] bg-[#f5f5f7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-75">
          <LogoMark size={22} />
          <span className="text-sm font-semibold tracking-tight">Nexus</span>
        </Link>

        <div className="flex items-center gap-6 text-xs text-black/60 dark:text-white/60">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Overview
          </Link>
          <Link href="/features" className="hover:text-black dark:hover:text-white transition-colors">
            Capabilities
          </Link>
        </div>
      </header>

      {/* Main Apple ID Card Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[460px] mx-auto text-center space-y-8">
          {/* Brand Icon & Heading */}
          <div className="space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-white dark:bg-[#1c1c1e] shadow-sm border border-black/[0.06] dark:border-white/[0.1] flex items-center justify-center">
              <LogoMark size={32} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Sign In to Nexus
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed max-w-sm mx-auto">
              Use your corporate account to access your organization&apos;s logistics operations.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-black/[0.06] dark:border-white/[0.1] p-8 sm:p-10 space-y-6 text-left">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {stage === "email" ? (
              <form onSubmit={handleEmailContinue} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="apple-email" className="block text-xs font-medium text-black/70 dark:text-white/70">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <input
                      id="apple-email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.12] text-sm text-[#1d1d1f] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-black/70 dark:text-white/70 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-black/20 dark:border-white/20 text-[#0071e3] focus:ring-[#0071e3] h-4 w-4"
                    />
                    <span>Remember my address</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black/50 dark:text-white/50">{email}</span>
                    <button
                      type="button"
                      onClick={() => setStage("email")}
                      className="text-xs text-[#0071e3] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="apple-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.12] text-sm text-[#1d1d1f] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <Link href="/forgot-password" className="text-[#0071e3] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-medium tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Workspace Switcher */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
              <span className="text-[11px] uppercase tracking-wider text-black/40 dark:text-white/40 block font-medium">
                Select Workspace Account
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ENTERPRISE_PROFILES.slice(0, 4).map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("Password123!");
                      setStage("password");
                      setError("");
                    }}
                    className="p-2.5 text-left rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] transition-colors"
                  >
                    <span className="text-xs font-medium text-[#1d1d1f] dark:text-white block truncate">
                      {acc.label}
                    </span>
                    <span className="text-[11px] text-black/50 dark:text-white/50 block truncate">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="text-xs text-black/60 dark:text-white/60 space-x-1">
            <span>Don&apos;t have an organization workspace?</span>
            <Link href="/signup" className="text-[#0071e3] hover:underline font-medium">
              Create yours now.
            </Link>
          </div>
        </div>
      </main>

      {/* Apple Keynote Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-[#f5f5f7]/95 dark:bg-[#000000]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm mx-auto text-center space-y-6">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-[#0071e3]/20 animate-ping" />
              <span className="absolute inset-0 rounded-full border-2 border-t-[#0071e3] border-r-[#0071e3] border-b-transparent border-l-transparent animate-spin" />
              <div className="h-14 w-14 rounded-full bg-white dark:bg-[#1c1c1e] shadow-lg flex items-center justify-center">
                <LogoMark size={28} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Welcome back, {transitionUser?.name || "Operator"}
              </h3>
              <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">
                Connecting to {transitionUser?.workspace_id || transitionUser?.workspaceId || "Nexus Network"}
              </p>
            </div>

            <div className="w-48 mx-auto h-1 bg-black/[0.08] dark:bg-white/[0.1] rounded-full overflow-hidden">
              <div className="h-full bg-[#0071e3] rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Apple-style Footer */}
      <footer className="border-t border-black/[0.08] dark:border-white/[0.1] py-6 px-6 lg:px-12 text-[11px] text-black/50 dark:text-white/50 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>Copyright © {new Date().getFullYear()} Nexus Inc. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <Link href="/contact" className="hover:underline">Privacy Policy</Link>
          <Link href="/contact" className="hover:underline">Terms of Use</Link>
          <Link href="/contact" className="hover:underline">Legal</Link>
        </div>
      </footer>
    </div>
  );
}
