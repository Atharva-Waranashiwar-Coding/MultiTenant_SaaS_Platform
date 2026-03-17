import apiClient from '../axios';
import type { Membership, MemberRole } from '@/types';

export const membersApi = {
  list: (orgId: string, params?: { search?: string; role?: MemberRole; teamId?: string; departmentId?: string; isActive?: boolean }) =>
    apiClient.get<Membership[]>(`/organizations/${orgId}/members`, { params }).then((r) => r.data),

  get: (orgId: string, userId: string) =>
    apiClient.get<Membership>(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),

  setActive: (orgId: string, userId: string, isActive: boolean) =>
    apiClient.patch<Membership>(`/organizations/${orgId}/members/${userId}/status`, { isActive }).then((r) => r.data),

  updateRole: (orgId: string, userId: string, role: MemberRole) =>
    apiClient
      .patch<Membership>(`/organizations/${orgId}/members/${userId}/role`, { role })
      .then((r) => r.data),

  remove: (orgId: string, userId: string) =>
    apiClient
      .delete<{ message: string }>(`/organizations/${orgId}/members/${userId}`)
      .then((r) => r.data),

  bulk: (orgId: string, userIds: string[], action: 'activate' | 'deactivate' | 'remove') =>
    apiClient
      .post<{ affected: number }>(`/organizations/${orgId}/members/bulk`, { userIds, action })
      .then((r) => r.data),
};
