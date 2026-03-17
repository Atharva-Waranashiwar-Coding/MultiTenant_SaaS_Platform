'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { isLoading } = useMe();

  useEffect(() => {
    if (_hasHydrated && !accessToken) {
      router.replace('/login');
    }
  }, [_hasHydrated, accessToken, router]);

  // Spinner while Zustand rehydrates from localStorage
  if (!_hasHydrated) {
    return <FullPageSpinner />;
  }

  // Not authenticated — render nothing while redirect fires
  if (!accessToken) {
    return null;
  }

  // Spinner while /auth/me loads
  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
