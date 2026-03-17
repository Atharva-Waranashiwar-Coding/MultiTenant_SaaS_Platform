'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMe } from '@/hooks/use-auth';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getApiErrorMessage } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { data: me, isLoading } = useMe();
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  const { mutate: updateProfile, isPending, error } = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; avatarUrl?: string }) =>
      authApi.updateMe(data),
    onSuccess: (updated) => {
      setUser(updated);
      qc.setQueryData(['me'], updated);
      toast.success('Profile updated');
    },
    onError: (e) => toast.error('Update failed', getApiErrorMessage(e)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (me) {
      reset({
        firstName: me.firstName,
        lastName: me.lastName,
        avatarUrl: me.avatarUrl ?? '',
      });
    }
  }, [me, reset]);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {[...Array(2)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update your name and avatar</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit((data) => updateProfile({
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl || undefined,
        }))}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(error)}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={me?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg">
                  {me ? getInitials(me.firstName, me.lastName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">{me?.firstName} {me?.lastName}</p>
                <p className="text-muted-foreground">{me?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input placeholder="Jane" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input placeholder="Smith" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Avatar URL <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                placeholder="https://example.com/avatar.png"
                {...register('avatarUrl')}
              />
              {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
              <p className="text-xs text-muted-foreground">Link to a publicly accessible image.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={me?.email ?? ''} disabled className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
