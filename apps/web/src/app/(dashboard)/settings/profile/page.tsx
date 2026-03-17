'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getApiErrorMessage } from '@/lib/utils';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});
type Form = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: (data: Form) =>
      apiClient.patch('/users/me', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) reset({ firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl ?? '' });
  }, [user, reset]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>Update your name and avatar URL</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit((data) => mutate(data))}>
          <CardContent className="space-y-4">
            {user && (
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {!user.isEmailVerified && (
                    <p className="text-xs text-yellow-600">Email not verified</p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {getApiErrorMessage(error)}
              </div>
            )}
            {isSuccess && (
              <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
                Profile updated.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input {...register('lastName')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Avatar URL <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="url" placeholder="https://..." {...register('avatarUrl')} />
              {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
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
