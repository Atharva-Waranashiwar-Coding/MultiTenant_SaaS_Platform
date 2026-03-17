import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization, MemberRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeOrganizationId: string | null;
  _hasHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setActiveOrganization: (orgId: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (v: boolean) => void;

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
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        const firstOrgId = user.memberships?.[0]?.organizationId ?? null;
        set({ user, accessToken, refreshToken, activeOrganizationId: firstOrgId });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setActiveOrganization: (orgId) => set({ activeOrganizationId: orgId }),

      setUser: (user) => set({ user }),

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, activeOrganizationId: null });
      },

      setHasHydrated: (v) => set({ _hasHydrated: v }),

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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
