'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusLed } from '@/components/ui/status-led';
import { Input } from '@/components/ui/input';
import { Users, Search, Shield, ArrowRight } from 'lucide-react';
import { INITIAL_USERS, UserItem } from '@/lib/mock-data';
import { FadeIn } from '@/components/motion';

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState('');
  const [users] = React.useState<UserItem[]>(INITIAL_USERS);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <FadeIn className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-on-surface-variant uppercase">
              <Link href="/admin" className="hover:underline">Admin Center</Link>
              <span>·</span>
              <span>User Governance</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nexus-on-surface tracking-tight mt-1">
              User Directory & RBAC Security Clearance
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/roles">
              <Button variant="secondary" size="sm" className="font-mono text-xs">
                <Shield className="h-3.5 w-3.5 mr-1" /> Manage Roles
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-nexus-surface-container-high shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-nexus-on-surface-variant" />
            <Input
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Profile</TableHead>
              <TableHead>Corporate Email</TableHead>
              <TableHead>Security Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-mono font-bold text-xs text-nexus-primary">
                  <Link href={`/admin/users/${u.id}`} className="hover:underline flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-nexus-secondary" />
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-nexus-on-surface-variant">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMINISTRATOR' ? 'critical' : u.role === 'OPERATIONS_MANAGER' ? 'healthy' : 'neutral'}>
                    {u.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{u.department}</TableCell>
                <TableCell>
                  <Badge variant={u.active ? 'healthy' : 'neutral'}>
                    <StatusLed status={u.active ? 'healthy' : 'neutral'} className="mr-1.5" />
                    {u.active ? 'Active' : 'Suspended'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-nexus-on-surface-variant">{u.lastActive}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/users/${u.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 font-mono text-xs">
                      Manage <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FadeIn>
    </AppShell>
  );
}
