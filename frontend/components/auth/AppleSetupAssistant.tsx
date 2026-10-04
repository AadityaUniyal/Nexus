"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Cpu,
  Globe2,
  Sliders,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Truck,
  Layers,
  Activity,
  Lock,
  Mail,
  User,
  MapPin,
  Clock,
  Compass,
  Zap,
  KeyRound,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { tactileAudio } from "@/lib/sound-effects";

export type SetupRole = "ADMINISTRATOR" | "SUPERVISOR_L1" | "SUPERVISOR_L2" | "SUPERVISOR_L3";

interface CityPreset {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  region: string;
}

const GLOBAL_CITY_PRESETS: CityPreset[] = [
  { name: "Dehradun", country: "India", lat: 30.3165, lng: 78.0322, timezone: "IST (UTC+5:30)", region: "Himalayan Corridor & North India" },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298, timezone: "CST (UTC-6:00)", region: "Midwest Freight Hub" },
  { name: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821, timezone: "CET (UTC+1:00)", region: "Central Europe Intermodal" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "SGT (UTC+8:00)", region: "Southeast Asia Port Matrix" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, timezone: "JST (UTC+9:00)", region: "Kanto Automated Dispatch" },
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, timezone: "GMT (UTC+0:00)", region: "UK & Thames Corridor" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, timezone: "IST (UTC+5:30)", region: "Western Port & Freight Gateway" },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.0060, timezone: "EST (UTC-5:00)", region: "Northeast Megalopolis" },
];

const HELLO_WORDS = ["Hello", "Hola", "Bonjour", "नमस्ते", "こんにちは", "Willkommen", "Ciao", "Olá"];

export function AppleSetupAssistant() {
  const router = useRouter();

  // Wizard Stage: 0 (Hello intro), 1 (Identity), 2 (Role), 3 (Geography), 4 (Fleet Calibration), 5 (Finalizing setup)
  const [stage, setStage] = React.useState<number>(0);
  const [helloIndex, setHelloIndex] = React.useState<number>(0);

  // Form States
  const [name, setName] = React.useState("Alex Rivera");
  const [email, setEmail] = React.useState("alex.rivera@continental-logistics.com");
  const [password, setPassword] = React.useState("NexusVault2026!");
  const [usePasskey, setUsePasskey] = React.useState(true);

  // Role
  const [selectedRole, setSelectedRole] = React.useState<SetupRole>("ADMINISTRATOR");

  // Company & Geography
  const [companyName, setCompanyName] = React.useState("Continental Logistics Global");
  const [selectedCity, setSelectedCity] = React.useState<CityPreset>(GLOBAL_CITY_PRESETS[0]); // Default Dehradun
  const [customCitySearch, setCustomCitySearch] = React.useState("");
  const [hubRadiusKm, setHubRadiusKm] = React.useState(120);

  // Fleet & Autonomy Calibration
  const [sector, setSector] = React.useState("Intermodal Freight & Cold-Chain");
  const [fleetSize, setFleetSize] = React.useState(60);
  const [targetSla, setTargetSla] = React.useState(98.5);
  const [autoApproveReroutes, setAutoApproveReroutes] = React.useState(true);
  const [freshStartNoFakeData, setFreshStartNoFakeData] = React.useState(true);

  // Progress engine state
  const [setupStepIndex, setSetupStepIndex] = React.useState(0);
  const [setupProgress, setSetupProgress] = React.useState(0);

  // Multilingual hello cycle
  React.useEffect(() => {
    if (stage === 0) {
      const interval = setInterval(() => {
        setHelloIndex((prev) => (prev + 1) % HELLO_WORDS.length);
      }, 1600);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Stage 5 setup progress simulation
  React.useEffect(() => {
    if (stage === 5) {
      const timer = setInterval(() => {
        setSetupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            completeAndRedirect();
            return 100;
          }
          const next = prev + 2;
          if (next >= 25 && next < 50) setSetupStepIndex(1);
          else if (next >= 50 && next < 75) setSetupStepIndex(2);
          else if (next >= 75 && next < 100) setSetupStepIndex(3);
          return next;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [stage]);

  const completeAndRedirect = () => {
    tactileAudio.playSuccess();
    const workspaceId = `ws-${(companyName || "nexus").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 18)}`;
    
    const userObject = {
      id: `usr-${selectedRole.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: name || "Enterprise Operator",
      email: email || "operator@nexus.continental",
      role: selectedRole,
      workspace_id: workspaceId,
      company_name: companyName,
      location: selectedCity,
    };

    const companyProfile = {
      companyName,
      sector,
      fleetSize,
      region: `${selectedCity.name}, ${selectedCity.country} (${selectedCity.region})`,
      targetSla,
      autoApproveReroutes,
      tempMonitoring: sector.includes("Cold-Chain") || sector.includes("Pharma"),
      evBatteryBufferPct: 20,
      driverMaxHours: 11,
      hazmatRestrictions: sector.includes("HAZMAT"),
      carbonTargetReductionPct: 15,
      freshStart: freshStartNoFakeData,
      city: selectedCity,
    };

    if (typeof window !== "undefined") {
      document.cookie = `nexus_demo_session=${userObject.id}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("nexus_demo_user", JSON.stringify(userObject));
      localStorage.setItem("nexus_company_profile", JSON.stringify(companyProfile));
      localStorage.setItem("nexus_company_name", companyName);
      localStorage.setItem("nexus_active_workspace_id", workspaceId);
      localStorage.setItem("nexus_workspace_location", JSON.stringify(selectedCity));
    }

    // Role-tailored destination
    if (selectedRole === "ADMINISTRATOR") {
      router.push("/admin/company");
    } else if (selectedRole === "SUPERVISOR_L1") {
      router.push("/overview");
    } else if (selectedRole === "SUPERVISOR_L2") {
      router.push("/operations");
    } else {
      router.push("/incidents");
    }
  };

  const handleNext = () => {
    tactileAudio.playClick();
    setStage((prev) => prev + 1);
  };

  const handleBack = () => {
    tactileAudio.playClick();
    setStage((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* Apple-Style Ambient Lighting Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-cyan-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[450px] bg-gradient-to-t from-emerald-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header & Navigation */}
      <header className="relative z-20 w-full max-w-4xl flex items-center justify-between py-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xs tracking-tighter">NX</span>
          </div>
          <span className="text-xs font-mono text-stone-300 tracking-wider uppercase font-semibold">
            Nexus Setup Assistant
          </span>
        </div>

        {stage > 0 && stage < 5 && (
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  stage === stepNumber
                    ? "w-8 bg-white"
                    : stage > stepNumber
                    ? "w-3 bg-emerald-400"
                    : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        <div className="text-xs font-mono text-stone-400">
          <Link href="/login" className="hover:text-white transition-colors">
            Sign In instead →
          </Link>
        </div>
      </header>

      {/* Central Interactive Glass Enclosure */}
      <main className="relative z-20 w-full max-w-3xl my-auto">
        <AnimatePresence mode="wait">
          {/* STAGE 0: Multilingual Hello Intro */}
          {stage === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-8 sm:p-14 rounded-3xl bg-stone-900/60 border border-white/10 backdrop-blur-3xl shadow-2xl text-center space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  key={helloIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5 }}
                  className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white via-stone-100 to-stone-400 bg-clip-text text-transparent min-h-[5rem] flex items-center justify-center"
                >
                  {HELLO_WORDS[helloIndex]}
                </motion.div>
                <p className="text-stone-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Welcome to Nexus. Let’s configure your autonomous logistics fleet, operational geography, and sovereign command tier.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-sm gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Begin Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-mono text-stone-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" /> Passkey Ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" /> Global Geographies
                </span>
              </div>
            </motion.div>
          )}

          {/* STAGE 1: Identity & Passkey Credentials */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-8 sm:p-12 rounded-3xl bg-stone-900/70 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-stone-300">
                  <KeyRound className="w-3 h-3 text-cyan-400" /> Step 1 of 4: Identity & Credentials
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Create Master Operator Identity
                </h2>
                <p className="text-xs sm:text-sm text-stone-400">
                  Set up your primary executive credentials with built-in biometric passkey simulation.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-mono text-stone-300 block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="pl-10 h-12 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-stone-300 block mb-1.5">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.rivera@continental-logistics.com"
                      className="pl-10 h-12 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-stone-300 block mb-1.5">Cryptographic Passphrase</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-10 h-12 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="h-1 flex-1 rounded-full bg-emerald-500" />
                    <div className="h-1 flex-1 rounded-full bg-emerald-500" />
                    <div className="h-1 flex-1 rounded-full bg-emerald-500" />
                    <div className="h-1 flex-1 rounded-full bg-emerald-500/30" />
                    <span className="text-[10px] font-mono text-emerald-400 pl-1">Strong Entropy</span>
                  </div>
                </div>

                {/* Apple Passkey Toggle Card */}
                <div
                  onClick={() => setUsePasskey(!usePasskey)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    usePasskey
                      ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200 shadow-lg"
                      : "bg-stone-950/40 border-stone-800 text-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${usePasskey ? "bg-cyan-500/20 text-cyan-300" : "bg-stone-800 text-stone-400"}`}>
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Enable Nexus Passkey™</h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Biometric hardware key authentication without storing passwords in memory.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${usePasskey ? "bg-cyan-500 border-cyan-400 text-black" : "border-stone-600"}`}>
                    {usePasskey && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!name || !email || !password}
                  size="lg"
                  className="px-8 py-5 rounded-xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-xs gap-2"
                >
                  <span>Continue to Role Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: Role Architecture Selection */}
          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-8 sm:p-12 rounded-3xl bg-stone-900/70 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-stone-300">
                  <ShieldCheck className="w-3 h-3 text-purple-400" /> Step 2 of 4: Role Tier Selection
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Choose Your Command Role
                </h2>
                <p className="text-xs sm:text-sm text-stone-400">
                  Each role unlocks a tailored dashboard, customized colour scheme, and specific telemetry privileges.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. Solo Admin */}
                <div
                  onClick={() => setSelectedRole("ADMINISTRATOR")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    selectedRole === "ADMINISTRATOR"
                      ? "bg-purple-950/40 border-purple-500/60 shadow-lg ring-1 ring-purple-500/50"
                      : "bg-stone-950/40 border-stone-800/80 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1.5">
                      👑 Solo Company Admin
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-300">
                      Tier 0
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Full organizational command: autonomous reroute policies, billing, company setup, and multi-user governance.
                  </p>
                  <span className="text-[10px] font-mono text-purple-400 block">Dashboard: /admin/company</span>
                </div>

                {/* 2. Supervisor L1 */}
                <div
                  onClick={() => setSelectedRole("SUPERVISOR_L1")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    selectedRole === "SUPERVISOR_L1"
                      ? "bg-blue-950/40 border-blue-500/60 shadow-lg ring-1 ring-blue-500/50"
                      : "bg-stone-950/40 border-stone-800/80 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-blue-300 flex items-center gap-1.5">
                      🌐 Regional Director
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-blue-500/40 text-blue-300">
                      Level 1
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Cross-corridor oversight: regional SLA tracking, bottleneck prediction, and multi-depot synchronization.
                  </p>
                  <span className="text-[10px] font-mono text-blue-400 block">Dashboard: /overview</span>
                </div>

                {/* 3. Supervisor L2 */}
                <div
                  onClick={() => setSelectedRole("SUPERVISOR_L2")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    selectedRole === "SUPERVISOR_L2"
                      ? "bg-amber-950/40 border-amber-500/60 shadow-lg ring-1 ring-amber-500/50"
                      : "bg-stone-950/40 border-stone-800/80 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-300 flex items-center gap-1.5">
                      ⚡ Dispatch Supervisor
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300">
                      Level 2
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Live operational dispatch: real-time asset pacing, vehicle reroutes, driver telemetry, and consignment handoffs.
                  </p>
                  <span className="text-[10px] font-mono text-amber-400 block">Dashboard: /operations</span>
                </div>

                {/* 4. Supervisor L3 */}
                <div
                  onClick={() => setSelectedRole("SUPERVISOR_L3")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    selectedRole === "SUPERVISOR_L3"
                      ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/50"
                      : "bg-stone-950/40 border-stone-800/80 hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-300 flex items-center gap-1.5">
                      🛡️ Safety Specialist
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-300">
                      Level 3
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Hazard triage: live weather anomaly mitigation, road closure incident response, and compliance auditing.
                  </p>
                  <span className="text-[10px] font-mono text-emerald-400 block">Dashboard: /incidents</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 hover:text-white text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="px-8 py-5 rounded-xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-xs gap-2"
                >
                  <span>Continue to Geographic Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: Regional Hub & Geographic Base (Universal City Setup) */}
          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-8 sm:p-12 rounded-3xl bg-stone-900/70 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-stone-300">
                  <Globe2 className="w-3 h-3 text-emerald-400" /> Step 3 of 4: Geographic Operational Base
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Set Up Primary Operating Hub
                </h2>
                <p className="text-xs sm:text-sm text-stone-400">
                  Select or search your home city. Nexus will dynamically calibrate map coordinate boundaries and regional routing models.
                </p>
              </div>

              {/* City Selection Pills */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono text-stone-300 block">Select Region / City</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GLOBAL_CITY_PRESETS.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        tactileAudio.playClick();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedCity.name === city.name
                          ? "bg-emerald-950/50 border-emerald-500/70 text-white shadow-md ring-1 ring-emerald-400/40"
                          : "bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">{city.name}</span>
                        <MapPin className={`w-3 h-3 ${selectedCity.name === city.name ? "text-emerald-400" : "text-stone-600"}`} />
                      </div>
                      <span className="text-[10px] text-stone-500 block truncate mt-1">{city.country}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Hub Spatial Badge */}
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-start justify-between font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-stone-500 block">Calibrated Operational Base</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedCity.name}, {selectedCity.country}</span>
                    <p className="text-[11px] text-stone-400">{selectedCity.region}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[10px] text-stone-500 block">Coordinates & Timezone</span>
                    <span className="text-[11px] text-stone-300 block">{selectedCity.lat.toFixed(4)}° N, {selectedCity.lng.toFixed(4)}° E</span>
                    <span className="text-[10px] text-cyan-400 block">{selectedCity.timezone}</span>
                  </div>
                </div>

                {/* Operational Radius Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-stone-300">Dispatch Perimeter Radius</span>
                    <span className="text-emerald-400 font-bold">{hubRadiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="10"
                    value={hubRadiusKm}
                    onChange={(e) => setHubRadiusKm(Number(e.target.value))}
                    className="w-full accent-emerald-400 bg-stone-800 rounded-lg cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-stone-500">
                    <span>30 km (Intra-City)</span>
                    <span>250 km (Regional)</span>
                    <span>500 km (Intermodal Corridor)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 hover:text-white text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="px-8 py-5 rounded-xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-xs gap-2"
                >
                  <span>Continue to Fleet Specs</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STAGE 4: Fleet & Autonomy Calibration */}
          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-8 sm:p-12 rounded-3xl bg-stone-900/70 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-stone-300">
                  <Sliders className="w-3 h-3 text-cyan-400" /> Step 4 of 4: Fleet & Autonomy Calibration
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Configure Enterprise Fleet
                </h2>
                <p className="text-xs sm:text-sm text-stone-400">
                  Set enterprise name, industry sector, and autonomous execution guardrails.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-mono text-stone-300 block mb-1.5">Organization / Enterprise Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Continental Logistics Global"
                      className="pl-10 h-12 rounded-xl bg-stone-950/60 border-stone-800 text-white placeholder:text-stone-600 focus:border-white/40 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-stone-300 block mb-1.5">Industry Sector</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full h-12 px-3.5 rounded-xl bg-stone-950/60 border border-stone-800 text-white font-mono text-xs focus:border-white/40 focus:outline-none"
                    >
                      <option value="Intermodal Freight & Cold-Chain">Intermodal Freight & Cold-Chain</option>
                      <option value="Port & Drayage Transport">Port & Drayage Transport</option>
                      <option value="Pharmaceutical & Bio-Cold Chain">Pharmaceutical & Bio-Cold Chain</option>
                      <option value="High-Value Secure Logistics">High-Value Secure Logistics</option>
                      <option value="Industrial Energy & HAZMAT">Industrial Energy & HAZMAT</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="text-stone-300">Initial Fleet Capacity</span>
                      <span className="text-cyan-400 font-bold">{fleetSize} Units</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="250"
                      step="5"
                      value={fleetSize}
                      onChange={(e) => setFleetSize(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-stone-800 rounded-lg cursor-pointer h-2 mt-3"
                    />
                  </div>
                </div>

                {/* Fresh Start Preference (Zero Pre-seeded Clutter) */}
                <div
                  onClick={() => setFreshStartNoFakeData(!freshStartNoFakeData)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    freshStartNoFakeData
                      ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
                      : "bg-stone-950/40 border-stone-800 text-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${freshStartNoFakeData ? "bg-emerald-500/20 text-emerald-300" : "bg-stone-800 text-stone-400"}`}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">Dynamic Zero-Clutter Clean State</h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Initialize clean live telemetry calibrated for {selectedCity.name} with zero hardcoded legacy clutter.
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${freshStartNoFakeData ? "bg-emerald-500 border-emerald-400 text-black" : "border-stone-600"}`}>
                    {freshStartNoFakeData && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="text-stone-400 hover:text-white text-xs gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  onClick={() => setStage(5)}
                  size="lg"
                  className="px-8 py-5 rounded-xl bg-white text-black font-semibold hover:bg-stone-200 transition-all text-xs gap-2 shadow-xl"
                >
                  <span>Initialize Nexus Fleet</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STAGE 5: Apple "Setting up your Nexus Sovereign Fleet..." Animated Engine */}
          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="p-10 sm:p-16 rounded-3xl bg-stone-900/80 border border-white/10 backdrop-blur-3xl shadow-2xl text-center space-y-8"
            >
              {/* Apple-style Animated Radial Progress */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-stone-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-cyan-400 transition-all duration-100 ease-linear"
                    strokeWidth="6"
                    strokeDasharray="263.89"
                    strokeDashoffset={263.89 - (263.89 * setupProgress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-xl font-black text-white">{setupProgress}%</span>
                  <span className="text-[9px] text-stone-400">CONFIG</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Configuring {companyName || "Nexus Fleet"}
                </h3>
                <p className="text-xs sm:text-sm font-mono text-cyan-300">
                  Calibrating operational twin for {selectedCity.name}, {selectedCity.country}...
                </p>
              </div>

              {/* Progress Steps Feed */}
              <div className="max-w-md mx-auto space-y-2.5 text-left font-mono text-xs">
                {[
                  { text: "Generating Sovereign Cryptographic Passkey Vault...", done: setupProgress >= 25 },
                  { text: `Establishing Spatial Boundary for ${selectedCity.name} Hub...`, done: setupProgress >= 50 },
                  { text: "Calibrating StreamGrid™ Telemetry Bus & Physics Engine...", done: setupProgress >= 75 },
                  { text: `Provisioning ${selectedRole.replace("_", " ")} Command Dashboard...`, done: setupProgress >= 95 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      item.done
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                        : "bg-stone-950/40 border-stone-800/80 text-stone-500"
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-700 animate-spin border-t-cyan-400 shrink-0" />
                    )}
                    <span className="text-[11px] truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-20 w-full max-w-4xl text-center py-4 text-stone-600 text-xs font-mono">
        Nexus Sovereign Logistics Platform · Apple Setup UI Assistant · All Rights Reserved
      </footer>
    </div>
  );
}
