'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionForm } from '@/components/app/application/subscription-form';
import { SubscriptionDrawer } from '@/components/app/application/subscriptions/drawer';
import type { SubscriptionDrawerProps } from '@/components/app/application/subscriptions/list';
import { SubscriptionDelete, SubscriptionList } from '@/components/app/application/subscriptions/list';
import { ListPagination } from '@/components/business/list-pagination';
import { ListToolbar } from '@/components/business/list-toolbar';
import { PageHeader } from '@/components/business/page-header';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscriptionForm } from '@/hooks/use-subscription-form';
import { useSubscriptionList } from '@/hooks/use-subscription-list';
import { SUBSCRIPTION_TAG_GROUP } from '@/lib/constants/tags';

function EditDrawer({ id, copyFromId, onSaved, ...props }: SubscriptionDrawerProps) {
  const [open, setOpen] = useState(false);
  const { form, onChange, ...controller } = useSubscriptionForm(
    () => {
      setOpen(false);
      onSaved();
    },
    id,
    copyFromId,
  );

  return (
    <SubscriptionDrawer {...props} {...controller} id={id} copyFromId={copyFromId} open={open} setOpen={setOpen}>
      <SubscriptionForm form={form} onChange={onChange} />
    </SubscriptionDrawer>
  );
}

export default function Page() {
  const t = useTranslations();

  const {
    params,
    state,
    changeParams,
    refresh,
    selectedIds,
    select,
    selectAll,
    removing,
    statusActions,
    removeSelected,
    removeItem,
  } = useSubscriptionList();
  const loading = state.status === 'loading';
  const snapshot = state.snapshot;
  const actionsDisabled = loading || removing || snapshot?.params !== params;

  useEffect(() => {
    if (state.status === 'error' && state.snapshot) {
      toast.error(state.message || t('admin.application.subscriptions.loadError'));
    }
  }, [state, t]);

  async function deleteSelected() {
    const result = await removeSelected();

    if (!result) {
      return;
    }

    if (result.failed > 0) {
      throw new Error(
        result.message ||
          t('admin.application.subscriptions.deleteSelectedError', { deleted: result.deleted, failed: result.failed }),
      );
    }

    toast.success(t('admin.application.subscriptions.deleteSelectedSuccess', { count: result.deleted }));
  }

  async function deleteItem(id: string) {
    const result = await removeItem(id);

    if (result?.failed) {
      throw new Error(result.message || t('admin.application.subscriptions.deleteError'));
    }

    if (result?.deleted) {
      toast.success(t('admin.application.subscriptions.deleteSuccess'));
    }
  }

  return (
    <section className="mx-auto w-full max-w-375 lg:p-2" aria-labelledby="subscriptions-title">
      <PageHeader
        titleId="subscriptions-title"
        title={t('admin.application.subscriptions.title')}
        description={t('admin.application.subscriptions.description')}
      >
        <EditDrawer
          disabled={loading || removing}
          onSaved={() => changeParams({ page: 1 })}
          triggerLabel={t('shared.new')}
        />
      </PageHeader>
      <div className="flex flex-col gap-4">
        <ListToolbar
          searchPlaceholder={t('admin.application.subscriptions.searchPlaceholder')}
          search={params.search ?? ''}
          status={params.status ?? 'all'}
          tagGroup={SUBSCRIPTION_TAG_GROUP}
          tagId={params.tagId}
          loading={loading}
          onSearch={(search) => changeParams({ search, page: 1 })}
          onStatusChange={(status) => changeParams({ status, page: 1 })}
          onTagChange={(tagId) => changeParams({ tagId, page: 1 })}
          onRefresh={refresh}
          refreshDisabled={loading || removing}
          actions={
            selectedIds.length > 0 && (
              <SubscriptionDelete
                disabled={actionsDisabled}
                label={t('shared.deleteSelected', { count: selectedIds.length })}
                onConfirm={deleteSelected}
              />
            )
          }
        />
        {state.status === 'error' && !snapshot ? (
          <Alert variant="destructive">
            <AlertTitle>{t('admin.application.subscriptions.loadError')}</AlertTitle>
            <AlertDescription>{state.message || t('shared.loadErrorDescription')}</AlertDescription>
            <AlertAction>
              <Button variant="outline" onClick={refresh}>
                {t('shared.refresh')}
              </Button>
            </AlertAction>
          </Alert>
        ) : (
          <SubscriptionList
            drawer={EditDrawer}
            onRemove={deleteItem}
            items={snapshot?.result.data ?? []}
            loading={loading}
            initialLoading={loading && !snapshot}
            filtered={
              Boolean(snapshot?.params.search || snapshot?.params.tagId) || (snapshot?.params.status ?? 'all') !== 'all'
            }
            onUpdated={refresh}
            statusActions={statusActions}
            selectedIds={selectedIds}
            onSelect={select}
            onSelectAll={selectAll}
            actionsDisabled={actionsDisabled}
          />
        )}
        {snapshot && (
          <ListPagination
            page={snapshot.result.page}
            size={snapshot.result.size}
            total={snapshot.result.total}
            disabled={actionsDisabled}
            onChange={changeParams}
          />
        )}
      </div>
    </section>
  );
}
