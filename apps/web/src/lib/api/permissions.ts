import apiClient from '../axios';
import type { MemberRole, RolePermissionOverride } from '@/types';

export const permissionsApi = {
  /** Returns a map of permission → boolean for the current user */
  getMyPermissions: (orgId: string) =>
    apiClient
      .get<Record<string, boolean>>(`/organizations/${orgId}/permissions/mine`)
      .then((r) => r.data),

  listOverrides: (orgId: string) =>
    apiClient
      .get<RolePermissionOverride[]>(`/organizations/${orgId}/permissions/overrides`)
      .then((r) => r.data),

  upsertOverride: (orgId: string, role: MemberRole, permission: string, granted: boolean) =>
    apiClient
      .post<RolePermissionOverride>(`/organizations/${orgId}/permissions/overrides`, {
        role,
        permission,
        granted,
      })
      .then((r) => r.data),

  deleteOverride: (orgId: string, id: string) =>
    apiClient
      .delete(`/organizations/${orgId}/permissions/overrides/${id}`)
      .then((r) => r.data),
};
