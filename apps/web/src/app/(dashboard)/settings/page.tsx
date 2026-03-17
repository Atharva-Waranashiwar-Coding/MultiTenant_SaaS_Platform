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
import { Separator } from '@/components/ui/separator';
import { getApiErrorMessage } from '@/lib/utils';

const orgSchema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  description: z.string().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

export default function SettingsPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: org, isLoading } = useOrganization(activeOrganizationId ?? undefined);
  const { mutate: update, isPending, error, isSuccess } = useUpdateOrganization(activeOrganizationId!);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  });

  useEffect(() => {
    if (org) reset({ name: org.name, description: org.description ?? '' });
  }, [org, reset]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your organization's name and description</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit((data) => update(data))}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(error)}
              </div>
            )}
            {isSuccess && (
              <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
                Organization updated successfully.
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
