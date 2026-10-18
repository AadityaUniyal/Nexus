'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserContextType {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id: string;
  publicMetadata?: { role?: string; workspace_id?: string };
  unsafeMetadata?: { role?: string };
}

export interface AuthContextType {
  user: UserContextType | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  logout: () => {},
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
  const role = user?.role || 'ADMINISTRATOR';

  const canDecommission = ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'SUPERVISOR_L1'].includes(role);
  const canManageSettings = ['ADMINISTRATOR'].includes(role);
  const canRunSimulations = ['ADMINISTRATOR', 'OPERATIONS_MANAGER', 'SUPERVISOR_L1', 'SUPERVISOR_L2', 'ANALYST'].includes(role);
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
    try {
      const stored = localStorage.getItem('nexus_demo_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          publicMetadata: { role: parsed.role, workspace_id: parsed.workspace_id },
        });
      } else {
        // If no user in localStorage, check if cookie exists
        if (typeof document !== 'undefined') {
          const hasSession = document.cookie.includes('nexus_demo_session=') || document.cookie.includes('nexus_session_token=');
          if (!hasSession) {
            setUser(null);
          }
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem('nexus_demo_user');
      localStorage.removeItem('nexus_access_token');
      localStorage.removeItem('nexus_active_workspace_id');
      localStorage.removeItem('nexus_company_profile');
      if (typeof document !== 'undefined') {
        document.cookie = 'nexus_demo_session=; path=/; max-age=0;';
        document.cookie = 'nexus_session_token=; path=/; max-age=0;';
      }
    } catch {
      // ignore
    }
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
