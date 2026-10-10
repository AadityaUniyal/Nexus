"use client";

import React, { useState } from "react";
import { useDrivers } from "@/lib/queries";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Link as LinkIcon,
  ShieldAlert,
  Copy,
  Check,
  Smartphone,
  Phone,
  Clock,
  X,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/format";

export default function DriversPage() {
  const { data: drivers, isLoading, refetch } = useDrivers();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [creating, setCreating] = useState(false);

  // Link Generation Modal
  const [linkModalData, setLinkModalData] = useState<{ driverName: string; link: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    try {
      setCreating(true);
      await api.createDriver({
        name: driverName.trim(),
        phone: driverPhone.trim() || undefined,
      });
      setShowCreateModal(false);
      setDriverName("");
      setDriverPhone("");
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to create driver");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateLink = async (driver: any) => {
    try {
      const res = await api.generateDriverLink(driver.id);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}/driver#token=${res.link_token}`;
      setLinkModalData({
        driverName: driver.name,
        link: fullUrl,
        expiresAt: res.expires_at,
      });
      setCopied(false);
    } catch (err: any) {
      alert(err.message || "Failed to generate link");
    }
  };

  const handleRevokeSessions = async (driverId: string) => {
    if (!confirm("Revoke all active PWA sessions for this driver? The driver will need a new link.")) return;
    try {
      await api.revokeDriverSessions(driverId);
      alert("Active sessions revoked successfully");
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to revoke sessions");
    }
  };

  const copyToClipboard = () => {
    if (linkModalData) {
      navigator.clipboard.writeText(linkModalData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Driver Roster</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your fleet drivers and issue one-time PWA tracking links.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Driver</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : !drivers || drivers.length === 0 ? (
        <Card className="p-12 text-center bg-zinc-900 border-zinc-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-200">No drivers in roster</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Add your first driver to generate a no-signup GPS tracking link for their phone browser.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
          >
            Add Driver Now
          </Button>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Duty Status</th>
                  <th className="px-4 py-3">Last Ping</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {drivers.map((driver) => {
                  const isOnline = driver.last_ping_at
                    ? Date.now() - new Date(driver.last_ping_at).getTime() < 10 * 60 * 1000
                    : false;

                  return (
                    <tr key={driver.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3.5 font-medium text-zinc-200 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {driver.name.charAt(0)}
                        </div>
                        <span>{driver.name}</span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-400 font-mono">
                        {driver.phone || "—"}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            driver.status === "on_duty"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              driver.status === "on_duty" ? "bg-emerald-400" : "bg-zinc-500"
                            }`}
                          />
                          {driver.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">
                        {driver.last_ping_at ? (
                          <span title={driver.last_ping_at}>
                            {new Date(driver.last_ping_at).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-zinc-600">Never</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateLink(driver)}
                          className="h-7 text-xs border-zinc-700 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30"
                        >
                          <LinkIcon className="w-3 h-3 mr-1" />
                          <span>PWA Link</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeSessions(driver.id)}
                          className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/30"
                        >
                          <ShieldAlert className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Driver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold">Add New Driver</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Driver Full Name
                </label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="bg-zinc-950 border-zinc-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Phone Number (Optional)
                </label>
                <Input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+1 555 0192"
                  className="bg-zinc-950 border-zinc-800 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !driverName.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {creating ? "Adding..." : "Add Driver"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Driver Link Modal */}
      {linkModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 p-6 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold">Driver PWA Link</h2>
              </div>
              <button
                onClick={() => setLinkModalData(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Send this link to <strong className="text-zinc-200">{linkModalData.driverName}</strong>.
              When opened in any smartphone browser (Safari or Chrome), tracking activates with zero signup.
            </p>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
              <input
                readOnly
                value={linkModalData.link}
                className="bg-transparent text-xs font-mono text-zinc-300 w-full outline-none select-all"
              />
              <Button
                size="sm"
                onClick={copyToClipboard}
                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono">
              Link expires: {formatDate(linkModalData.expiresAt)}
            </p>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setLinkModalData(null)}
                className="border-zinc-700 text-zinc-300 text-xs"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
