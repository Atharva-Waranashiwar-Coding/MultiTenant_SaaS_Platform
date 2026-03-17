import apiClient from '../axios';
import type { Invitation, MemberRole } from '@/types';

export const invitationsApi = {
  create: (orgId: string, data: { email: string; role?: MemberRole }) =>
    apiClient.post<Invitation>(`/organizations/${orgId}/invitations`, data).then((r) => r.data),

  list: (orgId: string) =>
    apiClient.get<Invitation[]>(`/organizations/${orgId}/invitations`).then((r) => r.data),

  revoke: (orgId: string, invitationId: string) =>
    apiClient
      .delete<{ message: string }>(`/organizations/${orgId}/invitations/${invitationId}`)
      .then((r) => r.data),

  preview: (token: string) =>
    apiClient.get<Invitation>(`/invitations/preview?token=${token}`).then((r) => r.data),

  accept: (token: string) =>
    apiClient.post('/invitations/accept', { token }).then((r) => r.data),
};
