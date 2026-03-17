import apiClient from '../axios';
import type { Membership, MemberRole } from '@/types';

export const membersApi = {
  list: (orgId: string) =>
    apiClient.get<Membership[]>(`/organizations/${orgId}/members`).then((r) => r.data),

  updateRole: (orgId: string, userId: string, role: MemberRole) =>
    apiClient
      .patch<Membership>(`/organizations/${orgId}/members/${userId}/role`, { role })
      .then((r) => r.data),

  remove: (orgId: string, userId: string) =>
    apiClient
      .delete<{ message: string }>(`/organizations/${orgId}/members/${userId}`)
      .then((r) => r.data),
};
