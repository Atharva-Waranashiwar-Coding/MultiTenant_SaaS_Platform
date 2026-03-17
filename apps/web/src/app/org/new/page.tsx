'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateOrganization } from '@/hooks/use-organizations';
import { getApiErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function NewOrgPage() {
  const { mutate: create, isPending, error } = useCreateOrganization();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const name = watch('name', '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Create your organization</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up a workspace for your team
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit((data) => create(data))}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {getApiErrorMessage(error)}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Organization name</Label>
                <Input
                  placeholder="Acme Corp"
                  {...register('name', {
                    onChange: (e) => setValue('slug', toSlug(e.target.value)),
                  })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>URL slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">platform/</span>
                  <Input placeholder="acme-corp" {...register('slug')} className="flex-1" />
                </div>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="What does your team work on?" {...register('description')} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create organization'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
