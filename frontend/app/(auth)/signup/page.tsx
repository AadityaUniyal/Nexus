"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/brand/Logo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  User,
  Sparkles
} from "lucide-react";

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
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [createdUser, setCreatedUser] = React.useState<any>(null);

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
      setError("Please provide your organization name.");
      return;
    }

    setLoading(true);
    setError("");
    setUserAlreadyExists(false);

    try {
      const workspaceId = `ws-${companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}` || "ws-default";

      const resp = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: "OPERATIONS_MANAGER",
          department: `${companyName} Operations`,
          workspace_id: workspaceId,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        let extracted = "";
        if (errJson.error?.message && typeof errJson.error.message === "string") {
          extracted = errJson.error.message;
        } else if (typeof errJson.detail === "string") {
          extracted = errJson.detail;
        } else if (Array.isArray(errJson.detail) && errJson.detail.length > 0) {
          const first = errJson.detail[0];
          extracted = first?.msg || first?.message || "Invalid input parameters.";
        } else if (typeof errJson.message === "string") {
          extracted = errJson.message;
        }

        if (
          errJson.error?.code === "USER_ALREADY_EXISTS" ||
          extracted.toLowerCase().includes("already exists") ||
          resp.status === 409
        ) {
          setUserAlreadyExists(true);
          setError(`An account with ${email} already exists.`);
        } else {
          setError(extracted || "Unable to create account. Please try again.");
        }
        return;
      }

      const data = await resp.json();
      const token = data.access_token || data.accessToken;
      const user = data.user;

      if (token) {
        const isSecure = window.location.protocol === "https:";
        document.cookie = `nexus_session_token=${token}; path=/; max-age=86400; SameSite=Lax${
          isSecure ? "; Secure" : ""
        }`;
        localStorage.setItem("nexus_access_token", token);
        if (user) {
          localStorage.setItem("nexus_active_workspace_id", user.workspace_id || workspaceId);
          localStorage.setItem("nexus_demo_user", JSON.stringify(user));
          localStorage.setItem("nexus_user_role", user.role);
        }
      }

      // Clear any stale local mock state
      localStorage.removeItem("nexus_custom_vehicles");
      localStorage.removeItem("nexus_custom_warehouses");
      localStorage.removeItem("nexus_custom_orders");
      localStorage.removeItem("nexus_custom_routes");
      localStorage.removeItem("nexus_custom_incidents");

      setCreatedUser(user);
      setIsTransitioning(true);
      router.prefetch("/overview");

      setTimeout(() => {
        router.push("/overview");
      }, 750);
    } catch (err: any) {
      console.warn("[SignUp] API network notice:", err);
      if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE) {
        const demoUser = {
          id: `usr-demo-${Date.now()}`,
          email: email.trim(),
          name: name.trim() || "Operations Lead",
          role: "OPERATIONS_MANAGER",
          department: `${companyName} Operations`,
          workspace_id: `ws-${companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}` || "ws-demo",
          isActive: true,
        };
        const token = "demo-operator-token";
        const isSecure = window.location.protocol === "https:";
        document.cookie = `nexus_session_token=${token}; path=/; max-age=86400; SameSite=Lax${
          isSecure ? "; Secure" : ""
        }`;
        localStorage.setItem("nexus_access_token", token);
        localStorage.setItem("nexus_active_workspace_id", demoUser.workspace_id);
        localStorage.setItem("nexus_demo_user", JSON.stringify(demoUser));
        localStorage.setItem("nexus_user_role", demoUser.role);
        setCreatedUser(demoUser);
        setIsTransitioning(true);
        setTimeout(() => router.push("/overview"), 750);
        return;
      }
      setError(err?.message || "Unable to reach the server. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col justify-between selection:bg-[#0071e3]/20 selection:text-[#0071e3] transition-colors duration-300">
      {/* Apple-style Minimal Navigation Bar */}
      <header className="h-12 w-full border-b border-black/[0.08] dark:border-white/[0.12] bg-[#f5f5f7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-75">
          <LogoMark size={22} />
          <span className="text-sm font-semibold tracking-tight">Nexus</span>
        </Link>

        <div className="flex items-center gap-6 text-xs text-black/60 dark:text-white/60">
          <Link href="/login" className="hover:text-black dark:hover:text-white transition-colors">
            Already have an account? Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[460px] mx-auto text-center space-y-8">
          <div className="space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-white dark:bg-[#1c1c1e] shadow-sm border border-black/[0.06] dark:border-white/[0.1] flex items-center justify-center">
              <LogoMark size={32} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Create Your Nexus ID
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed max-w-sm mx-auto">
              One account for your entire logistics footprint, live operations, and analytics.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-black/[0.06] dark:border-white/[0.1] p-8 sm:p-10 space-y-6 text-left">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
                {userAlreadyExists && (
                  <div className="pt-1 pl-6">
                    <Link
                      href={`/login?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#0071e3] hover:underline"
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
                <div className="space-y-1.5">
                  <label htmlFor="full-name" className="block text-xs font-medium text-black/70 dark:text-white/70">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First and last name"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.12] text-sm text-[#1d1d1f] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="work-email" className="block text-xs font-medium text-black/70 dark:text-white/70">
                    Corporate Email
                  </label>
                  <input
                    id="work-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.12] text-sm text-[#1d1d1f] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="signup-pwd" className="block text-xs font-medium text-black/70 dark:text-white/70">
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

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-black/50 dark:text-white/50">{email}</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[#0071e3] hover:underline"
                    >
                      Edit details
                    </button>
                  </div>

                  <label htmlFor="company-name" className="block text-xs font-medium text-black/70 dark:text-white/70 pt-2">
                    Organization / Company Name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    autoFocus
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Continental Freight Logistics"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.12] text-sm text-[#1d1d1f] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
                  />
                </div>

                <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">
                  By clicking Create Workspace, you agree to the Nexus Terms of Service and Privacy Policy.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-medium tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-xs text-black/60 dark:text-white/60 space-x-1">
            <span>Already have an account?</span>
            <Link href="/login" className="text-[#0071e3] hover:underline font-medium">
              Sign In.
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
                Preparing {companyName} Workspace
              </h3>
              <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed">
                Initializing autonomous logistics infrastructure for {name || "your team"}
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
          <Link href="/contact" className="hover:underline">Sales and Refunds</Link>
          <Link href="/contact" className="hover:underline">Legal</Link>
        </div>
      </footer>
    </div>
  );
}
