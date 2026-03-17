'use client';

import { useOrganizations } from '@/hooks/use-organizations';
import { useSwitchOrg } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRoleBadgeColor, formatDate } from '@/lib/utils';
import { Building2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function SelectOrgPage() {
  const { data: orgs, isLoading } = useOrganizations();
  const { mutate: switchOrg, isPending } = useSwitchOrg();
  const { activeOrganizationId } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Select organization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choose which workspace to enter
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {orgs?.map((org) => (
              <button
                key={org.id}
                className="w-full text-left"
                onClick={() => switchOrg(org.id)}
                disabled={isPending}
              >
                <Card className={`cursor-pointer transition-colors hover:border-primary ${org.id === activeOrganizationId ? 'border-primary' : ''}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {org.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.slug}</p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(org.role ?? 'MEMBER')}`}>
                      {org.role}
                    </span>
                  </CardContent>
                </Card>
              </button>
            ))}

            <Link href="/org/new">
              <Card className="cursor-pointer border-dashed hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                    <Plus className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">Create a new organization</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
