'use client';

import { useTranslations } from 'next-intl';
import { AccountForm } from '@/components/app/settings/account/account-form';
import { PageHeader } from '@/components/business/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';

export default function Page() {
  const t = useTranslations();
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (!isPending && !error && !session) {
    return null;
  }

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col items-center lg:p-2 [&>div]:w-full"
      aria-labelledby="account-title"
      aria-busy={isPending}
    >
      <PageHeader
        titleId="account-title"
        title={t('admin.settings.account.title')}
        description={t('admin.settings.account.description')}
      />

      <div className="max-w-3xl">
        {isPending ? (
          <div role="status" aria-label={t('admin.settings.account.loading')} className="space-y-6">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div role="alert" className="text-destructive flex items-center justify-between gap-3 text-sm">
            <span>{t('admin.settings.account.loadError')}</span>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              {t('shared.retry')}
            </Button>
          </div>
        ) : session ? (
          <AccountForm key={session.user.id} user={session.user} />
        ) : null}
      </div>
    </section>
  );
}
