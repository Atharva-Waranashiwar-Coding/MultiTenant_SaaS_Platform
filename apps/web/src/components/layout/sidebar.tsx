'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/audit', label: 'Audit Log', icon: ShieldCheck, roles: ['OWNER', 'ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { getActiveOrganization, getActiveRole } = useAuthStore();
  const org = getActiveOrganization();
  const role = getActiveRole();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Org branding */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
          {org?.name?.charAt(0) ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{org?.name ?? 'No Organization'}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{role ?? ''}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <Link
          href="/org/select"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <Building2 className="h-3.5 w-3.5" />
          Switch organization
        </Link>
      </div>
    </aside>
  );
}
