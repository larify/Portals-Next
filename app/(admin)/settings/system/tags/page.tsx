'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { TagDeleteResult } from '@/components/app/settings/system/tags/delete-confirmation';
import { TagHeader } from '@/components/app/settings/system/tags/header';
import { TagList } from '@/components/app/settings/system/tags/list';
import { TagToolbar } from '@/components/app/settings/system/tags/toolbar';
import { ListPagination } from '@/components/business/list-pagination';
import { Button } from '@/components/ui/button';
import { useTagList } from '@/hooks/use-tag';
import type { TagDetail } from '@/lib/types/tag';

export default function Page() {
  const t = useTranslations();

  const { params, state, changeParams, refresh, selectedIds, select, selectAll, removing, removeSelected, removeItem } =
    useTagList();
  const loading = state.status === 'loading';
  const snapshot = state.snapshot;
  const actionsDisabled = loading || removing || snapshot?.params !== params;

  useEffect(() => {
    if (state.status === 'error' && state.snapshot) {
      toast.error(state.message || t('admin.settings.system.tags.loadError'));
    }
  }, [state, t]);

  async function deleteSelected(): Promise<TagDeleteResult> {
    const result = await removeSelected();

    if (!result) {
      return { success: false };
    }

    if (result.failed > 0) {
      const message = t('admin.settings.system.tags.deleteSelectedError', {
        deleted: result.deleted,
        failed: result.failed,
      });

      toast.error(message);

      return { success: false, message };
    }

    toast.success(t('admin.settings.system.tags.deleteSelectedSuccess', { count: result.deleted }));

    return { success: true };
  }

  async function deleteTag(tag: TagDetail): Promise<TagDeleteResult> {
    const result = await removeItem(tag.id);

    if (!result) {
      return { success: false };
    }

    if (result.failed > 0) {
      return { success: false, message: result.message || t('admin.settings.system.tags.deleteError') };
    }

    toast.success(t('admin.settings.system.tags.deleteSuccess', { name: tag.label }));

    return { success: true };
  }

  return (
    <section className="mx-auto w-full max-w-375 lg:p-2" aria-labelledby="system-tags-title">
      <TagHeader disabled={loading || removing} onCreated={() => changeParams({ page: 1 })} />
      <div className="flex flex-col gap-4">
        <TagToolbar
          search={params.search ?? ''}
          group={params.group ?? 'all'}
          loading={loading}
          onSearch={(search) => changeParams({ search, page: 1 })}
          onGroupChange={(group) => changeParams({ group: group === 'all' ? undefined : group, page: 1 })}
          onRefresh={refresh}
          selectedCount={selectedIds.length}
          removing={removing}
          onDeleteSelected={deleteSelected}
        />
        {state.status === 'error' && !snapshot ? (
          <div
            role="alert"
            className="border-destructive/30 flex items-center justify-between gap-4 rounded-md border p-4"
          >
            <div>
              <p className="text-destructive text-sm font-medium">{t('admin.settings.system.tags.loadError')}</p>
              <p className="text-muted-foreground mt-1 text-sm">{state.message || t('shared.loadErrorDescription')}</p>
            </div>
            <Button variant="outline" onClick={refresh}>
              {t('shared.refresh')}
            </Button>
          </div>
        ) : (
          <TagList
            tags={snapshot?.result.data ?? []}
            loading={loading}
            initialLoading={loading && !snapshot}
            filtered={Boolean(snapshot?.params.search) || Boolean(snapshot?.params.group)}
            onUpdated={refresh}
            selectedIds={selectedIds}
            onSelect={select}
            onSelectAll={selectAll}
            actionsDisabled={actionsDisabled}
            removing={removing}
            onDelete={deleteTag}
          />
        )}
        {snapshot && (
          <ListPagination
            total={snapshot.result.total}
            page={snapshot.result.page}
            size={snapshot.result.size}
            disabled={actionsDisabled}
            onChange={changeParams}
          />
        )}
      </div>
    </section>
  );
}
