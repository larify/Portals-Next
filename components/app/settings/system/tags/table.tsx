'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListActions, ListActionTrigger } from '@/components/business/list-actions';
import { TagBadge } from '@/components/business/tag-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreferences } from '@/hooks/use-preferences';
import { TAG_GROUPS } from '@/lib/constants/tags';
import type { TagDetail } from '@/lib/types/tag';
import type { TagDeleteResult } from './delete-confirmation';
import { TagDeleteConfirmation } from './delete-confirmation';
import { TagDrawer } from './drawer';

export function TagTable({
  tags,
  loading,
  initialLoading,
  filtered,
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
  filtered: boolean;
  onUpdated: () => void;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
  removing: boolean;
  onDelete: (tag: TagDetail) => Promise<TagDeleteResult>;
}) {
  const t = useTranslations();

  const formatDateTime = usePreferences((state) => state.formatDateTime);

  return (
    <div className="relative overflow-hidden rounded-md border">
      {loading && !initialLoading && (
        <div
          role="progressbar"
          aria-label={t('admin.settings.system.tags.shared.loading')}
          className="bg-primary/10 pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden"
        >
          <div className="bg-primary animate-loading-progress h-full w-[35%] motion-reduce:w-full motion-reduce:animate-none" />
        </div>
      )}
      {initialLoading && (
        <span role="status" className="sr-only">
          {t('admin.settings.system.tags.shared.loading')}
        </span>
      )}
      <Table className="min-w-180 table-auto" aria-busy={loading}>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12 max-w-12 min-w-12 px-4">
              <Checkbox
                aria-label={t('shared.selectAll')}
                checked={tags.length > 0 && tags.every((tag) => selectedIds.includes(tag.id))}
                indeterminate={selectedIds.length > 0 && selectedIds.length < tags.length}
                disabled={actionsDisabled || tags.length === 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="min-w-44">{t('shared.name')}</TableHead>
            <TableHead className="min-w-40">{t('admin.settings.system.tags.shared.group')}</TableHead>
            <TableHead className="min-w-48">{t('admin.settings.system.tags.shared.preview')}</TableHead>
            <TableHead className="min-w-48">{t('shared.updatedAt')}</TableHead>
            <TableHead className="w-24 max-w-24 min-w-24 text-center">{t('shared.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialLoading ? (
            [0, 1, 2, 3, 4].map((row) => (
              <TableRow key={row} aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((column) => (
                  <TableCell key={column} className={column === 0 ? 'w-12 max-w-12 min-w-12 px-4' : undefined}>
                    <Skeleton className={column === 0 ? 'size-4' : 'h-4 w-24'} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : tags.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <p role="status" className="font-medium">
                  {t(filtered ? 'admin.settings.system.tags.shared.empty' : 'admin.settings.system.tags.empty')}
                </p>
              </TableCell>
            </TableRow>
          ) : null}
          {tags.map((tag) => {
            const group = TAG_GROUPS.find((group) => group.value === tag.group);

            return (
              <TableRow key={tag.id}>
                <TableCell className="w-12 max-w-12 min-w-12 px-4">
                  <Checkbox
                    aria-label={t('shared.selectRow', { name: tag.label })}
                    checked={selectedIds.includes(tag.id)}
                    disabled={actionsDisabled}
                    onCheckedChange={(checked) => onSelect(tag.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <TagDrawer
                    tagId={tag.id}
                    onSaved={onUpdated}
                    disabled={actionsDisabled}
                    triggerLabel={tag.label}
                    trigger={
                      <Button
                        variant="link"
                        size="sm"
                        className="max-w-64 cursor-pointer px-0 font-medium"
                        disabled={actionsDisabled}
                      />
                    }
                  />
                </TableCell>
                <TableCell>{group ? t(group.label) : tag.group}</TableCell>
                <TableCell>
                  <div className="max-w-48">
                    <TagBadge tag={tag} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">
                  {formatDateTime(tag.updatedAt)}
                </TableCell>
                <TableCell className="w-24 max-w-24 min-w-24 text-center">
                  <ListActions disabled={actionsDisabled}>
                    <TagDrawer tagId={tag.id} onSaved={onUpdated} disabled={actionsDisabled} />
                    <TagDrawer copyFromId={tag.id} onSaved={onUpdated} disabled={actionsDisabled} />
                    <Tooltip>
                      <TagDeleteConfirmation
                        description={t('admin.settings.system.tags.deleteConfirmation', { name: tag.label })}
                        trigger={
                          <TooltipTrigger
                            render={
                              <ListActionTrigger destructive disabled={actionsDisabled} label={t('shared.delete')} />
                            }
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
