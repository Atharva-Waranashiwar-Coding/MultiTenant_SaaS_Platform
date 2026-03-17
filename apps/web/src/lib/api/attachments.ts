import apiClient from '../axios';
import type { Attachment } from '@/types';

export const attachmentsApi = {
  upload: (orgId: string, file: File, projectId?: string, taskId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string> = {};
    if (projectId) params.projectId = projectId;
    if (taskId) params.taskId = taskId;
    return apiClient
      .post<Attachment>(`/organizations/${orgId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      })
      .then((r) => r.data);
  },

  list: (orgId: string, params: { projectId?: string; taskId?: string }) =>
    apiClient
      .get<Attachment[]>(`/organizations/${orgId}/attachments`, { params })
      .then((r) => r.data),

  delete: (orgId: string, attachmentId: string) =>
    apiClient
      .delete(`/organizations/${orgId}/attachments/${attachmentId}`)
      .then((r) => r.data),

  downloadUrl: (orgId: string, attachmentId: string) =>
    `${apiClient.defaults.baseURL}/organizations/${orgId}/attachments/${attachmentId}/download`,
};
