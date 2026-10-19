"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LogoMark } from "@/components/brand/Logo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api/http";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);

  // Step 1: Personal & Corporate Email
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  // Step 2: Organization Name
  const [companyName, setCompanyName] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [userAlreadyExists, setUserAlreadyExists] = React.useState(false);

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setUserAlreadyExists(false);
    setStep(2);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      setError("Please enter your organization name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resp = await apiFetch("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          workspaceName: companyName.trim(),
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const user = data.user;
        localStorage.removeItem("nexus_access_token");

        if (user) {
          if (user.workspace_id) localStorage.setItem("nexus_active_workspace_id", user.workspace_id);
          localStorage.removeItem("nexus_demo_user");
        }

        router.replace("/overview");
      } else {
        const errJson = await resp.json().catch(() => ({}));
        if (resp.status === 409 || errJson.detail?.toLowerCase().includes("exist")) {
          setUserAlreadyExists(true);
          setError("An account with this corporate email already exists.");
        } else {
          setError(errJson.detail || errJson.message || "Failed to create organization account.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Unable to reach registration service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0B0B0D] text-[#11120F] dark:text-[#F4F2EC] flex flex-col justify-between selection:bg-amber-500/20 selection:text-amber-600 font-sans transition-colors duration-300">
      {/* Global Header */}
      <header className="h-13 w-full border-b border-[#CFCBBF] dark:border-[#3A3836] bg-[#F6F4EE]/85 dark:bg-[#0B0B0D]/85 backdrop-blur-2xl px-6 lg:px-12 flex items-center justify-between z-40 transition-colors">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={22} />
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-sm font-bold tracking-tight text-[#11120F] dark:text-white uppercase">Nexus</span>
            <span className="text-[10px] text-[#7F5200] dark:text-[#FFC400] font-bold">OS</span>
          </div>
        </Link>

        <div className="flex items-center gap-6 text-xs font-mono text-stone-500 dark:text-stone-400">
          <Link href="/login" className="hover:text-black dark:hover:text-white transition-colors">
            Already have an account? Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] mx-auto text-center space-y-7"
        >
          <div className="space-y-2">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-white dark:bg-[#121216] border border-[#CFCBBF] dark:border-[#3A3836] shadow-tactile flex items-center justify-center">
              <LogoMark size={28} />
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tight text-[#11120F] dark:text-white font-mono">
              Create Workspace
            </h1>
            <p className="text-xs font-mono text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Create a workspace for your operations team.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121216] rounded-2xl border border-[#CFCBBF] dark:border-[#3A3836] shadow-tactile p-7 sm:p-8 space-y-6 text-left transition-colors">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
                {userAlreadyExists && (
                  <div className="pt-1 pl-6">
                    <Link
                      href={`/login?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1.5 font-bold text-[#7F5200] dark:text-[#FFC400] hover:underline"
                    >
                      <span>Sign in to your account instead</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1Continue} className="space-y-4">
                <div className="space-y-1.5 font-mono text-xs">
                  <label htmlFor="full-name" className="block text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px]">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-sm text-[#11120F] dark:text-[#F4F2EC] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7F5200] dark:focus:ring-[#FFC400] font-mono transition-all"
                  />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label htmlFor="work-email" className="block text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px]">
                    Corporate Email
                  </label>
                  <input
                    id="work-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-sm text-[#11120F] dark:text-[#F4F2EC] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7F5200] dark:focus:ring-[#FFC400] font-mono transition-all"
                  />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label htmlFor="signup-pwd" className="block text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-pwd"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
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
                  className="w-full h-11 rounded-xl bg-[#11120F] dark:bg-[#FFC400] text-white dark:text-[#0B0B0D] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-tactile"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">{email}</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] text-[#7F5200] dark:text-[#FFC400] hover:underline"
                    >
                      Edit details
                    </button>
                  </div>

                  <label htmlFor="company-name" className="block text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px] pt-2">
                    Workspace name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    autoFocus
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Northstar Logistics"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1EEE6] dark:bg-[#1C1C22] border border-[#CFCBBF] dark:border-[#3A3836] text-sm text-[#11120F] dark:text-[#F4F2EC] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7F5200] dark:focus:ring-[#FFC400] font-mono transition-all"
                  />
                </div>

                <p className="text-[11px] font-mono text-stone-500 leading-relaxed">
                  You can connect operational data after your workspace is created.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#11120F] dark:bg-[#FFC400] text-white dark:text-[#0B0B0D] text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-tactile disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-xs font-mono text-stone-500 space-x-1">
            <span>Already have an account?</span>
            <Link href="/login" className="text-[#7F5200] dark:text-[#FFC400] hover:underline font-bold">
              Sign In.
            </Link>
          </div>
        </motion.div>
      </main>

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
