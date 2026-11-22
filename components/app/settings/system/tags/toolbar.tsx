'use client';

import { RefreshCw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const [searchInput, setSearchInput] = useState(search);

  const groups = [
    { value: 'all', label: t('admin.settings.system.tags.allGroups') },
    ...TAG_GROUPS.map((group) => ({ value: group.value, label: t(group.label) })),
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(searchInput.trim());
        }}
      >
        <div className="relative w-full sm:w-80">
          <Input
            className="pr-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('admin.settings.system.tags.searchPlaceholder')}
            aria-label={t('admin.settings.system.tags.searchPlaceholder')}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-0.5 -translate-y-1/2"
            aria-label={t('shared.search')}
          >
            <Search />
          </Button>
        </div>
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
      </form>
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
