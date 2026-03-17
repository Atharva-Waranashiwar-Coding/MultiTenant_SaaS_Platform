'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvitationPreview, useAcceptInvitation } from '@/hooks/use-invitations';
import { useAuthStore } from '@/store/auth.store';
import { useSwitchOrg } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRoleBadgeColor, getApiErrorMessage } from '@/lib/utils';
import { Building2, Check, XCircle } from 'lucide-react';
import Link from 'next/link';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: invitation, isLoading, error } = useInvitationPreview(token);
  const { mutate: accept, isPending, isSuccess, error: acceptError } = useAcceptInvitation();
  const { mutate: switchOrg } = useSwitchOrg();

  if (!token) {
    return <p className="text-center text-muted-foreground">Invalid invitation link.</p>;
  }

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Loading invitation...</p>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <CardTitle>Invalid invitation</CardTitle>
          </div>
          <CardDescription>This invitation link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login">
            <Button variant="outline">Go to login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <CardTitle>You've joined {invitation?.organization?.name}!</CardTitle>
          </div>
          <CardDescription>You are now a member of this organization.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => {
            if (invitation?.organizationId) switchOrg(invitation.organizationId);
            else router.push('/dashboard');
          }}>
            Go to dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
            {invitation?.organization?.name?.charAt(0)}
          </div>
          <div>
            <CardTitle>{invitation?.organization?.name}</CardTitle>
            <CardDescription>has invited you to join their workspace</CardDescription>
          </div>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(invitation?.role ?? 'MEMBER')}`}>
            You'll join as {invitation?.role}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {acceptError && (
          <p className="text-sm text-destructive">{getApiErrorMessage(acceptError)}</p>
        )}
        {invitation?.status !== 'PENDING' && (
          <p className="text-sm text-muted-foreground">
            This invitation is {invitation?.status?.toLowerCase()}.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {!isAuthenticated() ? (
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              You need to be logged in to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Link href={`/login?redirect=/invite?token=${token}`} className="flex-1">
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link href={`/signup?redirect=/invite?token=${token}`} className="flex-1">
                <Button className="w-full">Create account</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => accept(token)}
            disabled={isPending || invitation?.status !== 'PENDING'}
          >
            {isPending ? 'Accepting...' : 'Accept invitation'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<p>Loading...</p>}>
          <InviteContent />
        </Suspense>
      </div>
    </div>
  );
}
