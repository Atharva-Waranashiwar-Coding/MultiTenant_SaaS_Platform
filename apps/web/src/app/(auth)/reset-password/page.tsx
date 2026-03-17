'use client';

import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Suspense } from 'react';
import { useResetPassword } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { mutate, isPending, error } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  if (!token) {
    return <p className="text-center text-muted-foreground">Invalid reset link.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((data) => mutate({ token, password: data.password }))}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {getApiErrorMessage(error)}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input type="password" placeholder="Repeat password" {...register('confirm')} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Resetting...' : 'Reset password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
