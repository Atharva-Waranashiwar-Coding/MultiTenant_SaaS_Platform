'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { auditApi } from '@/lib/api/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  USER_SIGNUP: 'User signed up',
  USER_LOGIN: 'User logged in',
  USER_LOGOUT: 'User logged out',
  USER_PASSWORD_RESET_REQUEST: 'Password reset requested',
  USER_PASSWORD_RESET_COMPLETE: 'Password reset completed',
  USER_EMAIL_VERIFIED: 'Email verified',
  ORG_CREATED: 'Organization created',
  ORG_UPDATED: 'Organization updated',
  MEMBER_INVITED: 'Member invited',
  MEMBER_INVITATION_ACCEPTED: 'Invitation accepted',
  MEMBER_INVITATION_REVOKED: 'Invitation revoked',
  MEMBER_REMOVED: 'Member removed',
  MEMBER_ROLE_CHANGED: 'Member role changed',
  MEMBER_JOINED: 'Member joined',
};

export default function AuditPage() {
  const { activeOrganizationId } = useAuthStore();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit', activeOrganizationId],
    queryFn: () => auditApi.list(activeOrganizationId!, 100),
    enabled: !!activeOrganizationId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Recent activity in your organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity ({logs?.length ?? 0} events)</CardTitle>
          <CardDescription>Last 100 events, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !logs?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    {log.user && (
                      <p className="text-xs text-muted-foreground">
                        by {log.user.firstName} {log.user.lastName} ({log.user.email})
                      </p>
                    )}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(log.meta)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
