"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Globe, MapPin, Clock, Ruler } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [country, setCountry] = useState("US");
  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en-US");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");

  // Auto-detect country, timezone, locale, and distance unit via Intl
  useEffect(() => {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const detectedLocale = navigator.language || "en-US";
      setTimezone(detectedTz);
      setLocale(detectedLocale);

      // Detect country from locale or timezone
      let detectedCountry = "US";
      if (detectedLocale.includes("-")) {
        detectedCountry = detectedLocale.split("-")[1].toUpperCase();
      } else if (detectedTz.includes("/")) {
        const parts = detectedTz.split("/");
        if (parts[0] === "America") detectedCountry = "US";
        else if (parts[0] === "Europe") detectedCountry = "DE";
        else if (parts[0] === "Asia") detectedCountry = "IN";
      }
      setCountry(detectedCountry);

      // Distance unit convention: US, GB, LR, MM often use miles, rest km
      if (["US", "GB", "LR", "MM"].includes(detectedCountry)) {
        setDistanceUnit("mi");
      } else {
        setDistanceUnit("km");
      }

      if (user?.name) {
        setWorkspaceName(`${user.name}'s Fleet`);
      } else {
        setWorkspaceName("Primary Fleet");
      }
    } catch {
      // Fallback defaults
      setTimezone("UTC");
      setCountry("US");
      setLocale("en-US");
      setDistanceUnit("km");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError("Please enter a workspace name");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.completeOnboarding({
        name: workspaceName.trim(),
        country: country.trim(),
        timezone: timezone.trim(),
        locale: locale.trim(),
        distance_unit: distanceUnit,
      });

      if (res && (res as any).workspace_id) {
        localStorage.setItem("nexus_workspace_id", (res as any).workspace_id);
      }

      await refreshUser();
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 bg-zinc-900 border-zinc-800 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your workspace</h1>
          <p className="text-sm text-zinc-400">
            One quick step to initialize your fleet&apos;s timezone, units, and regional defaults.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Workspace / Fleet Name
            </label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Express Logistics"
              required
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-300 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>Country Code</span>
              </label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="US"
                required
                className="bg-zinc-950 border-zinc-800 uppercase"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-300 mb-1.5">
                <Ruler className="w-3.5 h-3.5 text-zinc-400" />
                <span>Distance Unit</span>
              </label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value as "km" | "mi")}
                className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-300 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Default Timezone</span>
              </label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC or America/New_York"
                required
                className="bg-zinc-950 border-zinc-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-300 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>Locale</span>
              </label>
              <Input
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                placeholder="en-US"
                required
                className="bg-zinc-950 border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Workspace...
              </span>
            ) : (
              "Complete Onboarding & Open Cockpit"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
