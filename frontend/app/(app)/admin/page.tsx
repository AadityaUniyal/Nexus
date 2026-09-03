"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusLed } from "@/components/ui/status-led";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Shield,
  Users,
  Activity,
  Database,
  FileText,
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { UserItem, AuditLogItem, PipelineHealthItem } from "@/lib/mock-data";
import { dataProvider } from "@/lib/data-provider";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("users");

  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [pipeline, setPipeline] = React.useState<PipelineHealthItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      dataProvider.getUsers(),
      dataProvider.getAuditLogs(),
      dataProvider.getPipelineHealth(),
    ])
      .then(([u, a, p]) => {
        if (mounted) {
          setUsers(u);
          setAuditLogs(a);
          setPipeline(p);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch admin data:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState<UserItem["role"]>("OPERATOR");
  const [newUserDept, setNewUserDept] = React.useState("Dispatch Operations");

  const tabs = [
    { id: "users", label: "User Governance & RBAC", count: users.length, icon: <Users className="h-4 w-4" /> },
    { id: "pipeline", label: "Data Pipeline & Fabric", count: pipeline.length, icon: <Database className="h-4 w-4" /> },
    { id: "health", label: "System & Server Health", icon: <Server className="h-4 w-4" /> },
    { id: "audit", label: "Audit Log History", count: auditLogs.length, icon: <FileText className="h-4 w-4" /> },
  ];

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserDept,
      active: true,
      lastActive: "Just now",
    };
    setUsers((prev) => [newUser, ...prev]);
    setIsAddUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    toast({
      title: "User Created & RBAC Bound",
      message: `Provisioned credentials for ${newUser.name}.`,
      type: "success",
    });
  };

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-nexus-on-surface-variant uppercase">
              <span>Platform Governance</span>
              <span>·</span>
              <span>Administrator Clearance</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              Admin Platform Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "users" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                className="font-mono-data text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add User
              </Button>
            )}
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* 1. User Governance */}
        {activeTab === "users" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email Identifier</TableHead>
                <TableHead>Assigned Role (RBAC)</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-xs text-nexus-on-surface">{u.name}</TableCell>
                  <TableCell className="font-mono-data text-xs text-nexus-on-surface-variant">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "ADMINISTRATOR" ? "critical" : u.role === "OPERATIONS_MANAGER" ? "healthy" : "neutral"}
                      size="sm"
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusLed status={u.active ? "HEALTHY" : "OFFLINE"} size="sm" />
                      <span className="text-xs font-mono-data">{u.active ? "Active" : "Suspended"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono-data text-nexus-on-surface-variant">{u.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* 2. Data Pipeline & Fabric */}
        {activeTab === "pipeline" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipeline.map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <span className="text-[10px] font-mono-data text-nexus-on-surface-variant uppercase">
                      {p.sourceType}
                    </span>
                    <Badge variant={p.status === "HEALTHY" ? "healthy" : "attention"} size="sm">
                      {p.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 font-mono-data text-xs">
                    <p className="font-bold text-sm text-nexus-on-surface">{p.sourceName}</p>
                    <div className="flex justify-between text-nexus-on-surface-variant pt-2 border-t border-nexus-outline-variant/20">
                      <span>Latency:</span>
                      <span className="font-bold text-emerald-700">{p.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between text-nexus-on-surface-variant">
                      <span>Throughput:</span>
                      <span>{p.throughputPerSec.toLocaleString()} ops/sec</span>
                    </div>
                    <div className="flex justify-between text-nexus-on-surface-variant">
                      <span>Records Today:</span>
                      <span>{p.recordsToday.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3. System & Server Health */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">PostgreSQL Connection Pool</CardTitle>
                <Badge variant="healthy" size="sm">
                  Active
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono-data">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="truncate max-w-[160px]">aws.neon.tech</span>
                </div>
                <div className="flex justify-between">
                  <span>Pool Size:</span>
                  <span>10 Max Connections</span>
                </div>
                <div className="flex justify-between">
                  <span>Query Latency:</span>
                  <span className="font-bold text-emerald-700">8 ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Groq AI Inference Cluster</CardTitle>
                <Badge variant="healthy" size="sm">
                  Online
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono-data">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span>llama-3.3-70b-versatile</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span className="font-bold text-purple-700">220 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-700">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Next.js Edge Worker Engine</CardTitle>
                <Badge variant="healthy" size="sm">
                  Healthy
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono-data">
                <div className="flex justify-between">
                  <span>Node Runtime:</span>
                  <span>v22.16.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span>142 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="text-emerald-700">99.98%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. Audit Log History */}
        {activeTab === "audit" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Consequential Action</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Details & Audit Trail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono-data text-xs text-nexus-on-surface-variant">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-nexus-on-surface">{log.actorName}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono-data text-xs">{log.entityType}</TableCell>
                  <TableCell className="text-xs text-nexus-on-surface max-w-md leading-relaxed">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add User Modal */}
        <Dialog
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          title="Provision New Operator"
          description="Assign user credentials and RBAC permission boundaries."
        >
          <form onSubmit={handleAddUser} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Alex Morgan"
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="alex.morgan@nexus.ops"
            />

            <Select
              label="Assigned Role (RBAC)"
              value={newUserRole}
              onChange={(e: any) => setNewUserRole(e.target.value)}
              options={[
                { label: "OPERATIONS_MANAGER (Dispatch & Sim)", value: "OPERATIONS_MANAGER" },
                { label: "ANALYST (Simulations & Analytics)", value: "ANALYST" },
                { label: "OPERATOR (Live Telemetry)", value: "OPERATOR" },
                { label: "ADMINISTRATOR (Full Platform)", value: "ADMINISTRATOR" },
                { label: "VIEWER (Read Only)", value: "VIEWER" },
              ]}
            />

            <Input
              label="Department"
              value={newUserDept}
              onChange={(e) => setNewUserDept(e.target.value)}
              placeholder="e.g. Dispatch Operations"
            />

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create User
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppShell>
  );
}
