'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UserContextType {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id: string;
}

interface AuthContextType {
  user: UserContextType | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {}, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('nexus_auth_token');
    
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        // Check expiry
        if (payload.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            workspace_id: payload.workspace_id,
          });
        }
      } catch (err) {
        console.error('Failed to parse token', err);
        logout();
      }
    }
    
    setIsLoading(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
