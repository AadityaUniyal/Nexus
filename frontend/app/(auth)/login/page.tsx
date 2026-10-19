"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { apiFetch } from "@/lib/api/http";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[var(--surface)]" />}>
      <LoginContent />
    </React.Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect") || "/overview";
  const redirectTarget = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "/overview";
  const [email, setEmail] = React.useState(() => searchParams.get("email") || "");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        setError("We couldn’t sign you in with those details. Check them and try again.");
        return;
      }

      const data = await response.json();
      if (data.user) {
        localStorage.setItem("nexus_active_workspace_id", data.user.workspace_id || data.user.workspaceId || "");
        localStorage.removeItem("nexus_demo_user");
      }

      router.replace(redirectTarget);
    } catch {
      setError("Nexus couldn’t reach the sign-in service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)] text-[var(--on-surface)]">
      <header className="border-b border-black/[0.07] dark:border-white/[0.09]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Nexus home">
            <LogoMark size={25} />
            <span className="text-[15px] font-semibold tracking-[-0.035em]">nexus</span>
          </Link>
          <Link href="/" className="text-[12px] text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]">Back to home</Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white/70 dark:border-white/[0.1] dark:bg-white/[0.035]"><LockKeyhole size={17} className="text-emerald-800 dark:text-emerald-300" /></span>
            <h1 className="mt-5 text-[32px] font-semibold tracking-[-0.055em]">Welcome back.</h1>
            <p className="mt-2 text-[14px] text-[var(--on-surface-variant)]">Sign in to your Nexus workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/[0.08] bg-white/70 p-5 dark:border-white/[0.1] dark:bg-white/[0.025] sm:p-6">
            {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-[12px] leading-5 text-red-700 dark:text-red-300">{error}</p>}

            <div className="space-y-1.5">
              <label htmlFor="nexus-email" className="text-[12px] font-medium">Work email</label>
              <input
                id="nexus-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="h-11 w-full rounded-xl border border-black/[0.1] bg-[var(--surface)] px-3.5 text-[13px] outline-none transition-shadow placeholder:text-[var(--on-surface-variant)]/65 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15 dark:border-white/[0.13] dark:focus:border-emerald-300 dark:focus:ring-emerald-300/15"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="nexus-password" className="text-[12px] font-medium">Password</label>
                <Link href="/forgot-password" className="text-[11px] font-medium text-emerald-800 hover:underline dark:text-emerald-300">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="nexus-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-black/[0.1] bg-[var(--surface)] px-3.5 pr-11 text-[13px] outline-none transition-shadow placeholder:text-[var(--on-surface-variant)]/65 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15 dark:border-white/[0.13] dark:focus:border-emerald-300 dark:focus:ring-emerald-300/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-[var(--on-surface-variant)] transition-colors hover:text-[var(--on-surface)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#163d35] text-[12px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 dark:bg-[#cde5d9] dark:text-[#102a24]">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px] text-[var(--on-surface-variant)]">
            New to Nexus? <Link href="/signup" className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">Create a workspace</Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-black/[0.07] px-5 py-5 text-center text-[10px] text-[var(--on-surface-variant)] dark:border-white/[0.09]">
        Nexus · Logistics operations workspace
      </footer>
    </div>
  );
}
