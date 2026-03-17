'use client';

import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { Membership } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { getRoleBadgeColor, getInitials, formatDate } from '@/lib/utils';
import { Building2, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MemberDetailPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { activeOrganizationId } = useAuthStore();

  const { data: membership, isLoading } = useQuery<Membership>({
    queryKey: ['member', activeOrganizationId, userId],
    queryFn: () => apiClient.get(`/organizations/${activeOrganizationId}/members/${userId}`).then((r) => r.data),
    enabled: !!activeOrganizationId && !!userId,
  });

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!membership) {
    return <p className="text-muted-foreground">Member not found.</p>;
  }

  const user = membership.user;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/people" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to People
        </Link>
        <PageHeader title={`${user?.firstName} ${user?.lastName}`} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl">
                {user ? getInitials(user.firstName, user.lastName) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(membership.role)}`}>
                  {membership.role}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${membership.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {membership.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Joined</p>
              <p className="font-medium">{formatDate(membership.joinedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email verified</p>
              <p className="font-medium">{(user as any)?.isEmailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments */}
      {(user as any)?.departmentMembers?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(user as any).departmentMembers.map((dm: any) => (
                <div key={dm.department.id} className="flex items-center justify-between">
                  <Link href={`/departments/${dm.department.id}`} className="text-sm hover:underline">
                    {dm.department.name}
                  </Link>
                  {dm.isLead && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Lead</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      {(user as any)?.teamMembers?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(user as any).teamMembers.map((tm: any) => (
                <div key={tm.team.id} className="flex items-center justify-between">
                  <Link href={`/teams/${tm.team.id}`} className="text-sm hover:underline">
                    {tm.team.name}
                  </Link>
                  {tm.isLead && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Lead</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
