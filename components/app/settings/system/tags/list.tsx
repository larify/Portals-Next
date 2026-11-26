'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { ListActions, ListActionTrigger } from '@/components/business/list-actions';
import { RecordList } from '@/components/business/record-list';
import { TagBadge } from '@/components/business/tag-badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TAG_GROUPS } from '@/lib/constants/tags';
import type { TagDetail } from '@/lib/types/tag';
import type { TagDeleteResult } from './delete-confirmation';
import { TagDeleteConfirmation } from './delete-confirmation';
import { TagDrawer } from './drawer';

export function TagList({
  tags,
  loading,
  initialLoading,
  emptyAction,
  onUpdated,
  selectedIds,
  onSelect,
  onSelectAll,
  actionsDisabled,
  removing,
  onDelete,
}: {
  tags: readonly TagDetail[];
  loading: boolean;
  initialLoading: boolean;
  emptyAction: ReactNode;
  onUpdated: () => void;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
  removing: boolean;
  onDelete: (tag: TagDetail) => Promise<TagDeleteResult>;
}) {
  const t = useTranslations();

  return (
    <RecordList
      items={tags}
      getItemName={(tag) => tag.label}
      secondaryColumn={{
        label: t('admin.settings.system.tags.shared.group'),
        width: 'minmax(0, 1fr)',
        render: (tag) => {
          const group = TAG_GROUPS.find((group) => group.value === tag.group);

          return (
            <span className="text-muted-foreground block text-xs wrap-anywhere @4xl:text-sm">
              {group ? t(group.label) : tag.group}
            </span>
          );
        },
      }}
      detailColumns={[
        {
          label: t('admin.settings.system.tags.shared.preview'),
          width: 'minmax(0, 1fr)',
          render: (tag) => <TagBadge tag={tag} />,
        },
      ]}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.settings.system.tags.shared.loading')}
      emptyAction={emptyAction}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(tag) => ({
        title: (
          <Tooltip>
            <TagDrawer
              tagId={tag.id}
              onSaved={onUpdated}
              disabled={actionsDisabled}
              triggerLabel={tag.label}
              trigger={
                <TooltipTrigger
                  render={
                    <Button
                      variant="link"
                      size="sm"
                      className="block h-auto max-w-full cursor-pointer truncate p-0 text-left font-medium hover:no-underline"
                      disabled={actionsDisabled}
                    />
                  }
                />
              }
            />
            <TooltipContent side="top" className="wrap-anywhere">
              {tag.label}
            </TooltipContent>
          </Tooltip>
        ),
        actions: (
          <ListActions disabled={actionsDisabled}>
            <TagDrawer tagId={tag.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <TagDrawer copyFromId={tag.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <Tooltip>
              <TagDeleteConfirmation
                description={t('admin.settings.system.tags.deleteConfirmation', { name: tag.label })}
                trigger={
                  <TooltipTrigger
                    render={<ListActionTrigger destructive disabled={actionsDisabled} label={t('shared.delete')} />}
                  >
                    <Trash2 />
                  </TooltipTrigger>
                }
                disabled={actionsDisabled}
                pending={removing}
                onConfirm={() => onDelete(tag)}
              />
              <TooltipContent side="top">{t('shared.delete')}</TooltipContent>
            </Tooltip>
          </ListActions>
        ),
      })}
    />
  );
}
