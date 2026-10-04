"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Fingerprint,
  CheckCircle2,
  KeyRound,
  Globe2,
  MapPin,
  Building2,
  Cpu,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";

export type RoleOption = "ADMINISTRATOR" | "SUPERVISOR_L1" | "SUPERVISOR_L2" | "SUPERVISOR_L3";

interface RoleProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  role: RoleOption;
  color: string;
  badge: string;
  targetUrl: string;
}

const ROLES: Record<RoleOption, RoleProfile> = {
  ADMINISTRATOR: {
    id: "usr-admin-alex",
    name: "Alex Rivera",
    title: "Chief Logistics Officer & Company Admin",
    email: "alex.rivera@continental-logistics.com",
    role: "ADMINISTRATOR",
    color: "from-purple-500 to-indigo-500",
    badge: "Solo Admin · Tier 0",
    targetUrl: "/admin/company",
  },
  SUPERVISOR_L1: {
    id: "usr-sarah-104",
    name: "Sarah Chen",
    title: "Regional Operations Director (Supervisor L1)",
    email: "sarah.chen@continental-logistics.com",
    role: "SUPERVISOR_L1",
    color: "from-blue-500 to-cyan-500",
    badge: "Regional Hubs · Level 1",
    targetUrl: "/overview",
  },
  SUPERVISOR_L2: {
    id: "usr-david-04",
    name: "David Kim",
    title: "Fleet & Hub Dispatch Supervisor (Supervisor L2)",
    email: "david.kim@continental-logistics.com",
    role: "SUPERVISOR_L2",
    color: "from-amber-500 to-orange-500",
    badge: "Fleet Dispatch · Level 2",
    targetUrl: "/operations",
  },
  SUPERVISOR_L3: {
    id: "usr-elena-92",
    name: "Elena Rostova",
    title: "Field Safety & Incident Specialist (Supervisor L3)",
    email: "elena.rostova@continental-logistics.com",
    role: "SUPERVISOR_L3",
    color: "from-emerald-500 to-teal-500",
    badge: "Field Safety · Level 3",
    targetUrl: "/incidents",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<RoleOption>("ADMINISTRATOR");
  const [email, setEmail] = React.useState(ROLES.ADMINISTRATOR.email);
  const [password, setPassword] = React.useState("NexusPasskey2026!");
  const [loading, setLoading] = React.useState(false);
  const [passkeyActive, setPasskeyActive] = React.useState(false);
  const [error, setError] = React.useState("");

  // Location context loaded dynamically
  const [hubLocation, setHubLocation] = React.useState<{ name: string; country: string }>({
    name: "Dehradun",
    country: "India",
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLoc = localStorage.getItem("nexus_workspace_location");
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          if (parsed?.name) setHubLocation({ name: parsed.name, country: parsed.country || "Global" });
        }
      } catch {
        // fallback
      }
    }
  }, []);

  const handleRoleSelect = (roleKey: RoleOption) => {
    tactileAudio.playClick();
    setSelectedRole(roleKey);
    setEmail(ROLES[roleKey].email);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    tactileAudio.playClick();

    try {
      const activeRole = ROLES[selectedRole];
      const user = {
        id: activeRole.id,
        name: activeRole.name,
        email: email || activeRole.email,
        role: activeRole.role,
        workspace_id: "ws-continental-fleet-01",
      };

      if (typeof window !== "undefined") {
        document.cookie = `nexus_demo_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem("nexus_demo_user", JSON.stringify(user));
        localStorage.setItem("nexus_active_workspace_id", user.workspace_id);
      }

      tactileAudio.playSuccess();
      router.push(activeRole.targetUrl);
    } catch {
      setError("Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyQuickSignIn = () => {
    tactileAudio.playClick();
    setPasskeyActive(true);
    setTimeout(() => {
      tactileAudio.playSuccess();
      const activeRole = ROLES[selectedRole];
      const user = {
        id: activeRole.id,
        name: activeRole.name,
        email: activeRole.email,
        role: activeRole.role,
        workspace_id: "ws-continental-fleet-01",
      };

      if (typeof window !== "undefined") {
        document.cookie = `nexus_demo_session=${user.id}; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem("nexus_demo_user", JSON.stringify(user));
        localStorage.setItem("nexus_active_workspace_id", user.workspace_id);
      }

      router.push(activeRole.targetUrl);
    }, 900);
  };

  const activeProfile = ROLES[selectedRole];

  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* Apple Ambient Dynamic Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-purple-600/20 via-cyan-600/15 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[450px] bg-gradient-to-t from-emerald-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-xl flex items-center justify-between py-4 px-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-all">
            <span className="text-white font-black text-xs tracking-tighter">NX</span>
          </div>
          <span className="text-xs font-mono text-stone-300 font-semibold tracking-wider">
            NEXUS PASSKEY ID
          </span>
        </Link>

        {/* Operating Hub Location HUD */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-stone-800 text-[11px] font-mono text-stone-300">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{hubLocation.name} Hub</span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-20 w-full max-w-md my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="p-8 rounded-3xl bg-stone-900/75 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6"
        >
          {/* User Persona Avatar with Breathing Ring */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${activeProfile.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/10`}>
                {activeProfile.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-stone-950 border border-white/20 text-emerald-400 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{activeProfile.name}</h2>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{activeProfile.title}</p>
            </div>
          </div>

          {/* Apple Segmented Role Switcher Pills */}
          <div className="p-1 rounded-2xl bg-stone-950/70 border border-stone-800/80 grid grid-cols-4 gap-1 text-center font-mono">
            {(Object.keys(ROLES) as RoleOption[]).map((roleKey) => {
              const r = ROLES[roleKey];
              const isSelected = selectedRole === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleRoleSelect(roleKey)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                    isSelected
                      ? "bg-white text-black shadow-md"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  {roleKey === "ADMINISTRATOR"
                    ? "Admin"
                    : roleKey === "SUPERVISOR_L1"
                    ? "L1 Dir"
                    : roleKey === "SUPERVISOR_L2"
                    ? "L2 Disp"
                    : "L3 Safe"}
                </button>
              );
            })}
          </div>

          {/* Quick Passkey TouchID Button */}
          <Button
            type="button"
            onClick={handlePasskeyQuickSignIn}
            disabled={loading || passkeyActive}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/30 transition-all font-mono text-xs gap-2 shadow-lg"
          >
            {passkeyActive ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
                <span>Verifying Biometric Key...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>Sign In with Nexus Passkey</span>
              </div>
            )}
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-[10px] font-mono text-stone-500 uppercase">Or corporate pass</span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>

          {/* Standard Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-mono text-stone-300 block mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-stone-300">Master Passphrase</label>
                <Link href="/forgot-password" className="text-[10px] font-mono text-stone-400 hover:text-stone-200">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-mono text-xs"
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-xs gap-2 mt-2 shadow-xl"
            >
              <span>Authenticate Session</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer Call to Setup */}
          <div className="pt-2 text-center text-xs text-stone-400">
            <span>New company setup? </span>
            <Link href="/signup" className="text-white hover:underline font-semibold font-mono">
              Launch Apple Setup Assistant →
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-20 w-full max-w-xl text-center py-4 text-stone-600 text-xs font-mono">
        Sovereign Access Matrix · Hardware Bound Tokens
      </footer>
    </div>
  );
}
