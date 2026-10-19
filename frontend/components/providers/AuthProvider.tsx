'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserContextType {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id: string;
  workspace_name?: string;
  publicMetadata?: { role?: string; workspace_id?: string };
  unsafeMetadata?: { role?: string };
}

export interface AuthContextType {
  user: UserContextType | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: async () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const { user, isLoading } = useAuth();
  return {
    user,
    isLoaded: !isLoading,
    isSignedIn: !!user,
  };
}

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'VIEWER';

  const canDecommission = ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'SUPERVISOR_L1'].includes(role);
  const canManageSettings = ['ADMINISTRATOR'].includes(role);
  const canRunSimulations = ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'DISPATCHER', 'ANALYST'].includes(role);
  const isReadOnly = role === 'VIEWER';

  return {
    role,
    canDecommission,
    canManageSettings,
    canRunSimulations,
    isReadOnly,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/me/bootstrap', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session unavailable');
        return response.json();
      })
      .then((session) => {
        if (!active) return;
        const profile = session.user;
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: session.role || profile.role,
          workspace_id: session.workspace?.id || '',
          workspace_name: session.workspace?.name || '',
          publicMetadata: { role: session.role || profile.role, workspace_id: session.workspace?.id },
        });
      })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('nexus_active_workspace_id');
    } catch {}
    try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
