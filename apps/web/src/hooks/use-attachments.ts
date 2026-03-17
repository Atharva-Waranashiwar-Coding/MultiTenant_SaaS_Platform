'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '@/lib/api/attachments';

export function useAttachments(orgId?: string, params?: { projectId?: string; taskId?: string }) {
  return useQuery({
    queryKey: ['attachments', orgId, params],
    queryFn: () => attachmentsApi.list(orgId!, params ?? {}),
    enabled: !!orgId && !!(params?.projectId || params?.taskId),
  });
}

export function useUploadAttachment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, projectId, taskId }: { file: File; projectId?: string; taskId?: string }) =>
      attachmentsApi.upload(orgId, file, projectId, taskId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['attachments', orgId, { projectId: vars.projectId, taskId: vars.taskId }] });
      qc.invalidateQueries({ queryKey: ['attachments', orgId] });
    },
  });
}

export function useDeleteAttachment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentsApi.delete(orgId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', orgId] });
    },
  });
}
