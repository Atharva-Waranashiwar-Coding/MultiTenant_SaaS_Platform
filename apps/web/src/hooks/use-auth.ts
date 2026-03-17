'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/utils';

export function useMe() {
  const { accessToken, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export function useSignup() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      // New user: go to org creation
      router.replace('/org/new');
    },
  });
}

export function useLogin() {
  const { setAuth, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], data.user);

      // If user has no memberships, go create an org
      if (!data.user.memberships || data.user.memberships.length === 0) {
        router.replace('/org/new');
      } else if (data.user.memberships.length === 1) {
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
