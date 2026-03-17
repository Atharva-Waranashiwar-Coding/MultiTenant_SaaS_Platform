import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization, MemberRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeOrganizationId: string | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setActiveOrganization: (orgId: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;

  // Derived helpers
  isAuthenticated: () => boolean;
  getActiveOrganization: () => Organization | undefined;
  getActiveRole: () => MemberRole | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeOrganizationId: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Default active org to the first membership
        const firstOrgId = user.memberships?.[0]?.organizationId ?? null;
        set({ user, accessToken, refreshToken, activeOrganizationId: firstOrgId });

        // Keep localStorage in sync for the axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      setActiveOrganization: (orgId) => set({ activeOrganizationId: orgId }),

      setUser: (user) => set({ user }),

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, activeOrganizationId: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      isAuthenticated: () => !!get().accessToken,

      getActiveOrganization: () => {
        const { user, activeOrganizationId } = get();
        return user?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.organization;
      },

      getActiveRole: () => {
        const { user, activeOrganizationId } = get();
        return user?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
      },
    }),
    {
      name: 'saas-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeOrganizationId: state.activeOrganizationId,
        // Don't persist user — always reload from /auth/me for freshness
      }),
    },
  ),
);
