"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { api } from "@/lib/api/client";

export interface UserContextType {
  id: string;
  email: string;
  name: string;
  role: string;
  workspace_id?: string;
  needs_onboarding: boolean;
}

export interface AuthContextType {
  user: UserContextType | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useClerkUser();
  const [profile, setProfile] = useState<UserContextType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setProfile({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role || "viewer",
        workspace_id: data.workspace?.id,
        needs_onboarding: data.needs_onboarding,
      });
      if (data.workspace?.id) {
        localStorage.setItem("nexus_workspace_id", data.workspace.id);
      }
    } catch {
      setProfile({
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || "User",
        role: "viewer",
        needs_onboarding: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clerkLoaded) {
      fetchProfile();
    }
  }, [clerkLoaded, isSignedIn, clerkUser]);

  return (
    <AuthContext.Provider value={{ user: profile, isLoading: !clerkLoaded || isLoading, refreshUser: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
