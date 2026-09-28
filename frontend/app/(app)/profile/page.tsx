"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar3D } from "@/components/avatar/Avatar3D";
import { User, Shield, Activity, Clock, CheckCircle2, Save, Edit3 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch } from "@/lib/api/auth-fetch";
import { useToast } from "@/components/ui/toast";
import { tactileAudio } from "@/lib/sound-effects";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await authFetch("/api/v1/profile");
        setProfile(res);
        setName(res.name || "");
        setDepartment(res.department || "Logistics Command");
      } catch (err) {
        // Fallback to auth context
        if (user) {
          setName(user.name);
          setDepartment("Operations Command");
          setProfile({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: "Operations Command",
            workspaceId: user.workspace_id,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    tactileAudio.playClick();
    try {
      await authFetch("/api/v1/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, department }),
      });
      setProfile((prev: any) => ({ ...prev, name, department }));
      setEditing(false);
      tactileAudio.playSuccessChord();
      toast({
        title: "Profile Updated",
        message: "Operator profile details successfully persisted.",
        type: "success",
      });
    } catch (err: any) {
      tactileAudio.playCriticalAlert();
      toast({
        title: "Update Failed",
        message: err?.message || "Failed to update profile.",
        type: "critical",
      });
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name || user?.name || "Operations Lead";
  const displayEmail = profile?.email || user?.email || "operator@nexus.ops";
  const displayRole = profile?.role || user?.role || "OPERATIONS_MANAGER";
  const displayDepartment = profile?.department || "Fleet Command & Decision Dispatch";

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-nexus-surface border border-nexus-outline-variant/40 shadow-tactile flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <Avatar3D mood="WELCOME" size="lg" />
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold text-nexus-on-surface">{displayName}</h1>
                <Badge variant="healthy" size="sm">
                  {displayRole}
                </Badge>
              </div>
              <p className="text-xs text-nexus-on-surface-variant font-mono-data">{displayEmail}</p>
              <p className="text-xs text-nexus-on-surface-variant">
                Department: <span className="font-semibold text-nexus-on-surface">{displayDepartment}</span>
              </p>
              {profile?.workspaceId && (
                <p className="text-[11px] font-mono-data text-nexus-on-surface-variant/80">
                  Active Workspace: {profile.workspaceId}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(!editing)}
            className="font-mono-data text-xs gap-1.5 shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {editing && (
          <Card className="animate-in fade-in duration-300">
            <CardHeader>
              <CardTitle className="text-sm">Edit Operator Information</CardTitle>
              <CardDescription className="text-xs">Update your display name and assigned operations command unit.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono-data text-nexus-on-surface-variant">Display Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="font-mono-data text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono-data text-nexus-on-surface-variant">Department / Division</label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Continental Fleet Operations"
                    required
                    className="font-mono-data text-xs"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={saving} className="font-mono-data text-xs gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assigned Operational Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono-data">
              <div className="p-3 rounded-lg bg-nexus-surface-variant/30 flex justify-between">
                <span>Fleet Group:</span>
                <span className="font-semibold text-nexus-on-surface">Central & Southern Haulers (Active)</span>
              </div>
              <div className="p-3 rounded-lg bg-nexus-surface-variant/30 flex justify-between">
                <span>Primary Hub:</span>
                <span className="font-semibold text-nexus-on-surface">WH-CHI (Chicago Central Hub)</span>
              </div>
              <div className="p-3 rounded-lg bg-nexus-surface-variant/30 flex justify-between">
                <span>Dispatch Authority:</span>
                <span className="font-semibold text-emerald-600">FULL_TRANSACTIONAL</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security & Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>RUN_SIMULATION (Deterministic What-If Branching)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>APPLY_DECISION (ACID Dispatch Mutation)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>RESOLVE_INCIDENT (Lifecycle Sign-off & Audit)</span>
              </div>
              <div className="flex items-center gap-2 text-nexus-on-surface">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>VIEW_ANALYTICS (Microsoft Fabric Lakehouse Metrics)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
