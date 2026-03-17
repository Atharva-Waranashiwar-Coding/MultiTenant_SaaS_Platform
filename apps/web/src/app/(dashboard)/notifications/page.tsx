'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/use-notifications';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationType } from '@/types';

const TYPE_LABELS: Record<NotificationType, string> = {
  INVITE_ACCEPTED:    'Invite accepted',
  MEMBER_ADDED:       'Member added',
  MEMBER_ROLE_CHANGED:'Role changed',
  PROJECT_ASSIGNED:   'Added to project',
  TASK_ASSIGNED:      'Task assigned',
  TASK_DUE_SOON:      'Due soon',
};

export default function NotificationsPage() {
  const { activeOrganizationId } = useAuthStore();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useNotifications(activeOrganizationId ?? undefined, {
    unreadOnly,
    page,
    limit: 20,
  });
  const markRead = useMarkNotificationRead(activeOrganizationId!);
  const markAll = useMarkAllRead(activeOrganizationId!);

  const notifications = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Notifications" description="Activity and alerts for your organization">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }}
            />
            Unread only
          </label>
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : !notifications.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Bell className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  !n.isRead && 'bg-muted/40',
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', !n.isRead && 'font-medium')}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-[10px] rounded-full bg-muted px-1.5 py-0.5">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                  </div>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    title="Mark as read"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
