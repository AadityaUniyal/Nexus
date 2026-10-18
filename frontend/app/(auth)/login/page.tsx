"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import { apiFetch } from "@/lib/api/http";
import { AppleHelloGreeting } from "@/components/auth/AppleHelloGreeting";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0B0B0D]" />}>
      <AppleStyleLoginContent />
    </React.Suspense>
  );
}

function AppleStyleLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/overview";
  const initialRole = searchParams.get("role") || "";
  const skipGreetingParam = searchParams.get("skip_greeting") === "true";

  // Apple Hello / Namaste greeting state
  const [showGreeting, setShowGreeting] = React.useState(!skipGreetingParam);

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
        setShowGreeting(false);
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
      const resp = await apiFetch("/api/v1/auth/login", {
        method: "POST",
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
        setError(errJson.error?.message || errJson.detail || errJson.message || "The corporate email or password you entered is incorrect.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach authentication service. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0B0B0D] text-[#11120F] dark:text-[#F4F2EC] flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-600 font-sans transition-colors duration-300">
      {/* ===================================================================== */}
      {/* APPLE HELLO / NAMASTE GREETING OVERLAY */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showGreeting && (
          <AppleHelloGreeting onUnlock={() => setShowGreeting(false)} />
        )}
      </AnimatePresence>

      {/* Apple-style Global Nav with XERJ 1px Hairline */}
      <header className="h-13 w-full border-b border-[#CFCBBF] dark:border-[#3A3836] bg-[#F6F4EE]/85 dark:bg-[#0B0B0D]/85 backdrop-blur-2xl px-6 lg:px-12 flex items-center justify-between z-40 transition-colors">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={22} />
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-sm font-bold tracking-tight text-[#11120F] dark:text-white uppercase">Nexus</span>
            <span className="text-[10px] text-[#7F5200] dark:text-[#FFC400] font-bold">OS</span>
          </div>
        </Link>

        <div className="flex items-center gap-6 text-xs font-mono text-stone-500 dark:text-stone-400">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            HOME
          </Link>
          <Link href="/live-world" className="hover:text-black dark:hover:text-white transition-colors">
            LIVE MAP
          </Link>
          <button
            type="button"
            onClick={() => setShowGreeting(true)}
            className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#CFCBBF] dark:border-[#3A3836] hover:bg-black/5 dark:hover:bg-white/5"
          >
            HELLO SCREEN
          </button>
        </div>
      </header>

      {/* Main Authentication Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] mx-auto text-center space-y-7"
        >
          {/* Brand Icon & Heading */}
          <div className="space-y-2">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-tactile flex items-center justify-center">
              <LogoMark size={28} />
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tight text-[#11120F] dark:text-white font-mono">
              Sign In to Nexus
            </h1>
            <p className="text-xs font-mono text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Authentic multi-tenant logistics workspace authentication.
            </p>
          </div>

          {/* Form Card (XERJ 1px rule + Apple Spring Interior) */}
          <div className="bg-white dark:bg-[#121216] rounded-2xl border border-[#CFCBBF] dark:border-[#3A3836] shadow-tactile p-7 sm:p-8 space-y-6 text-left transition-colors">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {stage === "email" ? (
              <form onSubmit={handleEmailContinue} className="space-y-4">
                <div className="space-y-1.5 font-mono text-xs">
                  <label htmlFor="apple-email" className="block text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px]">
                    Corporate Email Address
                  </label>
                  <input
                    id="apple-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-sm text-[#11120F] dark:text-[#F4F2EC] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7F5200] dark:focus:ring-[#FFC400] font-mono transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-600 dark:text-stone-400 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#CFCBBF] dark:border-[#3A3836] text-amber-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <span>Remember address</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#11120F] dark:bg-[#FFC400] text-white dark:text-[#0B0B0D] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-tactile"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">{email}</span>
                    <button
                      type="button"
                      onClick={() => setStage("email")}
                      className="text-[11px] text-[#7F5200] dark:text-[#FFC400] hover:underline"
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
                      placeholder="••••••••••••"
                      className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-sm text-[#11120F] dark:text-[#F4F2EC] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7F5200] dark:focus:ring-[#FFC400] font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#11120F] dark:bg-[#FFC400] text-white dark:text-[#0B0B0D] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-tactile disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Enterprise Profiles Switcher */}
            <div className="pt-4 border-t border-[#CFCBBF] dark:border-[#3A3836] space-y-2.5">
              <span className="text-[10px] uppercase tracking-wider font-mono text-stone-400 block font-bold">
                Direct Enterprise Identities
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ENTERPRISE_PROFILES.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("Password123!");
                      setStage("password");
                      setError("");
                    }}
                    className="p-2.5 text-left rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] hover:border-amber-500/50 border border-[#CFCBBF]/60 dark:border-[#3A3836] transition-all"
                  >
                    <span className="text-xs font-bold font-mono text-[#11120F] dark:text-white block truncate">
                      {acc.label}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 block truncate">
                      {acc.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-xs font-mono text-stone-500 space-x-1">
            <span>New workspace?</span>
            <Link href="/signup" className="text-[#7F5200] dark:text-[#FFC400] hover:underline font-bold">
              Enroll your organization now.
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-[#F6F4EE]/95 dark:bg-[#0B0B0D]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm mx-auto text-center space-y-5 font-mono">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-tactile flex items-center justify-center">
              <LogoMark size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold tracking-tight text-[#11120F] dark:text-white">
                Welcome back, {transitionUser?.name || "Operator"}
              </h3>
              <p className="text-xs text-stone-500">
                Opening workspace: {transitionUser?.workspace_id || "ws-continental-fleet-01"}
              </p>
            </div>

            <div className="w-40 mx-auto h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#CFCBBF] dark:border-[#3A3836] py-5 px-6 lg:px-12 text-[11px] font-mono text-stone-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>NEXUS.OS · APACHE-2.0 · 2026</span>
        <div className="flex items-center gap-5">
          <Link href="/contact" className="hover:underline">Privacy</Link>
          <Link href="/contact" className="hover:underline">Terms</Link>
          <Link href="/contact" className="hover:underline">Security</Link>
        </div>
      </footer>
    </div>
  );
}
