'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/use-auth';
import { getApiErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { mutate, isPending, error } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for that email, we sent a password reset link.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-sm text-primary hover:underline">Back to login</Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email and we'll send a reset link</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((data) => mutate(data.email, { onSuccess: () => setSent(true) }))}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {getApiErrorMessage(error)}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send reset link'}
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:underline text-center">
            Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
