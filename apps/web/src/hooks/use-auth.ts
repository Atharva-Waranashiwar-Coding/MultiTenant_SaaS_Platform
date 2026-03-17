'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';

export function useMe() {
  const { accessToken, setUser, clearAuth } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const user = await authApi.me();
        setUser(user);
        return user;
      } catch {
        clearAuth();
        throw new Error('Session expired');
      }
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useSignup() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      const fullUser = await authApi.me();
      setAuth(fullUser, data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], fullUser);
      router.replace('/org/new');
    },
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Set tokens first so axios interceptor picks them up
      setAuth(data.user, data.accessToken, data.refreshToken);

      // Fetch full user with memberships
      const fullUser = await authApi.me();
      setAuth(fullUser, data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], fullUser);

      const memberships = fullUser.memberships ?? [];
      if (memberships.length === 0) {
        router.replace('/org/new');
      } else if (memberships.length === 1) {
        router.replace('/dashboard');
      } else {
        router.replace('/org/select');
      }
    },
  });
}

export function useLogout() {
  const { clearAuth, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ''),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.replace('/login');
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => router.replace('/login'),
  });
}

export function useSwitchOrg() {
  const { setTokens, setActiveOrganization } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.switchOrg,
    onSuccess: (data, orgId) => {
      setTokens(data.accessToken, data.refreshToken);
      setActiveOrganization(orgId);
      queryClient.invalidateQueries();
      router.replace('/dashboard');
    },
  });
}
