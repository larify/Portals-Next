'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListSearch } from '@/components/business/list-search';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TAG_GROUPS } from '@/lib/constants/tags';
import type { TagDeleteResult } from './delete-confirmation';
import { TagDeleteConfirmation } from './delete-confirmation';

export interface TagToolbarProps {
  search: string;
  group: string;
  loading: boolean;
  onSearch: (search: string) => void;
  onGroupChange: (group: string) => void;
  onRefresh: () => void;
  selectedCount: number;
  removing: boolean;
  onDeleteSelected: () => Promise<TagDeleteResult>;
}

export function TagToolbar({
  search,
  group,
  loading,
  onSearch,
  onGroupChange,
  onRefresh,
  selectedCount,
  removing,
  onDeleteSelected,
}: TagToolbarProps) {
  const t = useTranslations();

  const groups = [
    { value: 'all', label: t('admin.settings.system.tags.allGroups') },
    ...TAG_GROUPS.map((group) => ({ value: group.value, label: t(group.label) })),
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row">
        <ListSearch
          search={search}
          placeholder={t('admin.settings.system.tags.searchPlaceholder')}
          onSearch={onSearch}
        />
        <Select
          value={group}
          items={groups}
          onValueChange={(value) => {
            if (value !== null) {
              onGroupChange(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label={t('admin.settings.system.tags.shared.group')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            {groups.map((group) => (
              <SelectItem key={group.value} value={group.value}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <TagDeleteConfirmation
            description={t('admin.settings.system.tags.deleteSelectedConfirmation', { count: selectedCount })}
            trigger={
              <Button variant="destructive" disabled={loading || removing}>
                {t('shared.deleteSelected', { count: selectedCount })}
              </Button>
            }
            disabled={loading || removing}
            pending={removing}
            onConfirm={onDeleteSelected}
          />
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                disabled={loading || removing}
                onClick={onRefresh}
                aria-label={t('shared.refresh')}
                aria-busy={loading}
              />
            }
          >
            <RefreshCw aria-hidden="true" className={loading ? 'animate-spin motion-reduce:animate-none' : undefined} />
          </TooltipTrigger>
          <TooltipContent side="top">{t('shared.refresh')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
