'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { useOrganization, useUpdateOrganization } from '@/hooks/use-organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getApiErrorMessage } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { MemberRole } from '@/types';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Amsterdam', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

const INVITE_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
];

const orgSchema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  description: z.string().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #3B82F6)')
    .optional()
    .or(z.literal('')),
  timezone: z.string().min(1),
  defaultInviteRole: z.enum(['MEMBER', 'MANAGER', 'ADMIN'] as const),
});
type OrgForm = z.infer<typeof orgSchema>;

export default function SettingsPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: org, isLoading } = useOrganization(activeOrganizationId ?? undefined);
  const { mutate: update, isPending, error } = useUpdateOrganization(activeOrganizationId!);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { timezone: 'UTC', defaultInviteRole: 'MEMBER' },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        description: org.description ?? '',
        brandColor: org.brandColor ?? '',
        timezone: org.timezone ?? 'UTC',
        defaultInviteRole: (org.defaultInviteRole as MemberRole) ?? 'MEMBER',
      });
    }
  }, [org, reset]);

  const brandColorValue = watch('brandColor') ?? '';

  const onSubmit = (data: OrgForm) => {
    update(
      {
        name: data.name,
        description: data.description,
        brandColor: data.brandColor || undefined,
        timezone: data.timezone,
        defaultInviteRole: data.defaultInviteRole as MemberRole,
      },
      {
        onSuccess: () => toast.success('Organization updated'),
        onError: (e) => toast.error('Update failed', getApiErrorMessage(e)),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's details and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your organization's name and description</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(error)}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Organization name</Label>
              <Input placeholder="Acme Corp" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="What does your organization do?" {...register('description')} />
            </div>

            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={org?.slug ?? ''} disabled className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Slugs cannot be changed after creation.</p>
            </div>
          </CardContent>

          {/* Branding section */}
          <CardContent className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium text-foreground">Branding &amp; Defaults</p>

            <div className="space-y-1.5">
              <Label>Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
                  value={brandColorValue || '#3B82F6'}
                  onChange={(e) => setValue('brandColor', e.target.value, { shouldDirty: true })}
                />
                <Input
                  placeholder="#3B82F6"
                  className="font-mono"
                  {...register('brandColor')}
                />
              </div>
              {errors.brandColor && (
                <p className="text-xs text-destructive">{errors.brandColor.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select
                value={watch('timezone')}
                onValueChange={(v) => setValue('timezone', v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Default invite role</Label>
              <Select
                value={watch('defaultInviteRole')}
                onValueChange={(v) => setValue('defaultInviteRole', v as MemberRole, { shouldDirty: true })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Role assigned when inviting new members.</p>
            </div>
          </CardContent>

          <div className="px-6 pb-6">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium">Delete organization</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this organization and all its data.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled title="Available in Phase 2">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
