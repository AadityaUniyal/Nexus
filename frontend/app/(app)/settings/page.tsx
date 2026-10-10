"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/lib/queries";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Globe,
  Clock,
  Ruler,
  Users,
  UserPlus,
  Copy,
  Check,
  Shield,
  Loader2,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { data: workspace, refetch: refetchWorkspace } = useWorkspace();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [locale, setLocale] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");

  // Members & Invites State
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState("dispatcher");
  const [inviteResult, setInviteResult] = useState<{ link: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setCountry(workspace.country || "");
      setTimezone(workspace.timezone || "");
      setLocale(workspace.locale || "");
      setDistanceUnit(workspace.distance_unit || "km");
    }
  }, [workspace]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.getWorkspaceMembers();
      setMembers(res);
    } catch {
      // Ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await api.updateWorkspace({
        name,
        country,
        timezone,
        locale,
        distance_unit: distanceUnit,
      });
      setSuccessMsg("Workspace settings updated successfully.");
      refetchWorkspace();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createWorkspaceInvite({
        role: inviteRole,
        expires_in_hours: 48,
      });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}/invite/${res.invite_code}`;
      setInviteResult({ link: fullUrl, expiresAt: res.expires_at });
      setCopied(false);
    } catch (err: any) {
      alert(err.message || "Failed to create invite");
    }
  };

  const copyInviteLink = () => {
    if (inviteResult) {
      navigator.clipboard.writeText(inviteResult.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-500" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure regional defaults, distance metrics, and manage team member access.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Regional & Localization Settings */}
      <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-5 shadow-lg">
        <div className="pb-3 border-b border-zinc-800">
          <h2 className="text-base font-bold text-zinc-200">Regional &amp; Units Configuration</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            These settings govern timezone conversions, route distance units, and timestamp formatting.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Workspace Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>Country Code</span>
              </label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                required
                className="bg-zinc-950 border-zinc-800 font-mono uppercase"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Default IANA Timezone</span>
              </label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Default Locale
              </label>
              <Input
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5"
            >
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Team Members & Teammate Invites */}
      <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Team Members</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Teammates with access to this fleet workspace.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setShowInviteModal(true);
              setInviteResult(null);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Teammate</span>
          </Button>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-3 py-2.5">User ID / Email</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {members.map((m, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/40">
                  <td className="px-3 py-3 font-mono text-xs">{m.user_id}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-zinc-400 font-mono text-[11px]">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold">Generate Teammate Invite</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inviteResult ? (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Assign Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dispatcher">Dispatcher (Create/Edit Jobs)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                    <option value="owner">Owner (Full Admin)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                    className="border-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                    Generate One-Time Link
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Share this one-time invite link with your teammate. When they sign in via Clerk, they will be joined to this workspace.
                </p>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                  <input
                    readOnly
                    value={inviteResult.link}
                    className="bg-transparent text-xs font-mono text-zinc-300 w-full outline-none select-all"
                  />
                  <Button
                    size="sm"
                    onClick={copyInviteLink}
                    className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 text-xs flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                    className="border-zinc-700 text-zinc-300 text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
