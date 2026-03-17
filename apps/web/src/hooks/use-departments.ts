'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/lib/api/departments';

export function useDepartments(orgId?: string) {
  return useQuery({
    queryKey: ['departments', orgId],
    queryFn: () => departmentsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useDepartment(orgId?: string, deptId?: string) {
  return useQuery({
    queryKey: ['department', orgId, deptId],
    queryFn: () => departmentsApi.get(orgId!, deptId!),
    enabled: !!orgId && !!deptId,
  });
}

export function useCreateDepartment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => departmentsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments', orgId] }),
  });
}

export function useUpdateDepartment(orgId: string, deptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) => departmentsApi.update(orgId, deptId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', orgId] });
      qc.invalidateQueries({ queryKey: ['department', orgId, deptId] });
    },
  });
}

export function useDeleteDepartment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deptId: string) => departmentsApi.remove(orgId, deptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments', orgId] }),
  });
}

export function useAddDepartmentMember(orgId: string, deptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; isLead?: boolean }) => departmentsApi.addMember(orgId, deptId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['department', orgId, deptId] }),
  });
}

export function useRemoveDepartmentMember(orgId: string, deptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => departmentsApi.removeMember(orgId, deptId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['department', orgId, deptId] }),
  });
}
