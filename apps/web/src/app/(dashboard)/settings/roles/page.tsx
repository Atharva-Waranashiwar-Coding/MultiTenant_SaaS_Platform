'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { usePermissionOverrides, useUpsertPermissionOverride, useDeletePermissionOverride } from '@/hooks/use-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { getApiErrorMessage } from '@/lib/utils';
import type { MemberRole } from '@/types';
import { Shield, Plus, Trash2, Info } from 'lucide-react';

// All available permissions grouped by module
const PERMISSION_GROUPS: Record<string, string[]> = {
  members:     ['members.view', 'members.invite', 'members.update_role', 'members.deactivate', 'members.remove'],
  departments: ['departments.view', 'departments.create', 'departments.update', 'departments.delete', 'departments.manage_members'],
  teams:       ['teams.view', 'teams.create', 'teams.update', 'teams.delete', 'teams.manage_members'],
  projects:    ['projects.view', 'projects.create', 'projects.update', 'projects.delete', 'projects.archive', 'projects.manage_members'],
  tasks:       ['tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign'],
  settings:    ['settings.view', 'settings.update', 'billing.view', 'billing.update', 'audit.view', 'roles.manage'],
};

const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();
const ROLES: MemberRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];

export default function RolesPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;

  const { data: overrides, isLoading } = usePermissionOverrides(activeOrganizationId ?? undefined);
  const upsert = useUpsertPermissionOverride(activeOrganizationId!);
  const remove = useDeletePermissionOverride(activeOrganizationId!);

  const [newRole, setNewRole] = useState<MemberRole>('MANAGER');
  const [newPermission, setNewPermission] = useState('');
  const [newGranted, setNewGranted] = useState(true);
  const [error, setError] = useState('');

  if (myRole !== 'OWNER') {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-medium">Access Restricted</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Only the organization Owner can manage role permissions.
        </p>
      </div>
    );
  }

  const handleAdd = () => {
    setError('');
    if (!newPermission) return;
    upsert.mutate(
      { role: newRole, permission: newPermission, granted: newGranted },
      {
        onSuccess: () => { setNewPermission(''); },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Roles & Permissions"
        description="Customize which permissions each role has in your organization"
      />

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          These overrides customize the default permissions. Granting a permission gives a role access
          it wouldn't have by default; revoking removes access. Deleting an override reverts to the default.
        </p>
      </div>

      {/* Active overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Overrides</CardTitle>
          <CardDescription>Permission customizations applied to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
            </div>
          ) : !overrides?.length ? (
            <EmptyState icon={Shield} title="No overrides" description="All roles use default permissions." />
          ) : (
            <div className="divide-y">
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-20 shrink-0 rounded-full bg-muted px-2 py-0.5 text-center text-xs font-medium">{o.role}</span>
                  <code className="flex-1 text-xs text-muted-foreground">{o.permission}</code>
                  <span className={`text-xs font-medium ${o.granted ? 'text-green-700' : 'text-destructive'}`}>
                    {o.granted ? 'GRANTED' : 'REVOKED'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(o.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add override */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Override</CardTitle>
          <CardDescription>Grant or revoke a permission for a specific role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as MemberRole)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Permission</label>
              <Select value={newPermission} onValueChange={setNewPermission}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{group}</div>
                      {perms.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Action</label>
              <Select value={newGranted ? 'grant' : 'revoke'} onValueChange={(v) => setNewGranted(v === 'grant')}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="revoke">Revoke</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!newPermission || upsert.isPending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {upsert.isPending ? 'Adding...' : 'Add override'}
          </Button>
        </CardContent>
      </Card>

      {/* Reference card: default permissions per role */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Default Permissions Reference</CardTitle>
          <CardDescription>What each role can do by default (before any overrides)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Permission</th>
                  {ROLES.map((r) => <th key={r} className="px-2 py-2 font-medium text-muted-foreground">{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 font-mono text-muted-foreground">{perm}</td>
                    {ROLES.map((role) => {
                      const hasDefault = getDefaultForRole(role, perm);
                      return (
                        <td key={role} className="px-2 py-1.5 text-center">
                          <span className={hasDefault ? 'text-green-600' : 'text-gray-300'}>
                            {hasDefault ? '✓' : '–'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client-side default permission check (mirrors backend defaults)
function getDefaultForRole(role: MemberRole, permission: string): boolean {
  const memberDefaults = [
    'members.view', 'departments.view', 'teams.view', 'projects.view',
    'tasks.view', 'tasks.create', 'tasks.update', 'settings.view',
  ];
  const managerExtra = [
    'members.invite',
    'departments.create', 'departments.update', 'departments.manage_members',
    'teams.create', 'teams.update', 'teams.manage_members',
    'projects.create', 'projects.update', 'projects.archive', 'projects.manage_members',
    'tasks.delete', 'tasks.assign',
  ];
  const adminExcludes = ['billing.update', 'roles.manage'];

  if (role === 'OWNER') return true;
  if (role === 'ADMIN') return !adminExcludes.includes(permission);
  if (role === 'MANAGER') return [...memberDefaults, ...managerExtra].includes(permission);
  return memberDefaults.includes(permission);
}
