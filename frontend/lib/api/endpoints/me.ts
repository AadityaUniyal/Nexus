import { authFetch } from '../auth-fetch';

export interface BootstrapData {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
    role: string;
    department?: string;
    isActive: boolean;
  };
  workspace?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    region: string;
    scale: string;
    isDemo: boolean;
  };
  role: string;
  permissions: string[];
  onboarding: {
    completed: boolean;
    status: string;
    nextStep?: string | null;
  };
  unreadNotifications: number;
  dataFreshness: string;
  destination: string;
  avatar: {
    enabled: boolean;
    reducedMotion: boolean;
    companionHintsEnabled: boolean;
    soundEnabled: boolean;
    avatarVariant: string;
  };
}

export const meApi = {
  getBootstrap: () => authFetch<BootstrapData>('/api/v1/me/bootstrap'),
  getAvatar: () => authFetch('/api/v1/me/avatar'),
  updateAvatar: (data: any) => authFetch('/api/v1/me/avatar', { method: 'PATCH', body: JSON.stringify(data) }),
};
