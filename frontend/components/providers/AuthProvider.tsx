'use client';

import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export interface UserContextType {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const user: UserContextType | null =
    isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.username || 'Operator',
          role: (clerkUser.publicMetadata?.role as string) || 'OPERATIONS_MANAGER',
          workspace_id:
            (clerkUser.publicMetadata?.workspace_id as string) ||
            'ws-continental-fleet-01',
        }
      : null;

  const logout = () => {
    signOut({ redirectUrl: '/login' });
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}
