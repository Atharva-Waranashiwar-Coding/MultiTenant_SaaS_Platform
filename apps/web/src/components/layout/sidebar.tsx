'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  FolderKanban,
  Layers,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  // People section
  { href: '/people',       label: 'People',        icon: Users },
  { href: '/departments',  label: 'Departments',   icon: Building2 },
  { href: '/teams',        label: 'Teams',          icon: UsersRound },
  // Work section
  { href: '/projects',     label: 'Projects',      icon: FolderKanban },
  // Admin section
  { href: '/members',      label: 'Members',       icon: Layers, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { href: '/settings',     label: 'Settings',      icon: Settings },
  { href: '/audit',        label: 'Audit Log',     icon: ShieldCheck, roles: ['OWNER', 'ADMIN'] },
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
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0">
      {/* Org branding */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
          {org?.name?.charAt(0) ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{org?.name ?? 'No Organization'}</p>
          <p className="truncate text-xs text-sidebar-foreground/60 capitalize">{role?.toLowerCase() ?? ''}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3">
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
