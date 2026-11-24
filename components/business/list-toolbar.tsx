'use client';

import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTagOptions } from '@/hooks/use-tag';
import { ListSearch } from './list-search';
import { TagBadge } from './tag-badge';

export interface ListToolbarProps {
  searchPlaceholder: string;
  actions?: ReactNode;
  search: string;
  status: 'all' | 'enabled' | 'disabled';
  tagGroup: string;
  tagId?: string;
  loading: boolean;
  onSearch: (search: string) => void;
  onStatusChange: (status: 'all' | 'enabled' | 'disabled') => void;
  onTagChange: (tagId?: string) => void;
  onRefresh: () => void;
  refreshDisabled: boolean;
}

export function ListToolbar({
  searchPlaceholder,
  actions,
  search,
  status,
  tagGroup,
  tagId,
  loading,
  onSearch,
  onStatusChange,
  onTagChange,
  onRefresh,
  refreshDisabled,
}: ListToolbarProps) {
  const t = useTranslations();

  const { status: tagStatus, options: tags, reload: reloadTags } = useTagOptions(tagGroup);
  const allTags = { value: 'all', label: t('shared.allTags') };
  const tagItems = [allTags, ...tags.map((tag) => ({ value: tag.id, label: tag.label }))];
  const selectedTagLabel = tags.find((tag) => tag.id === tagId)?.label ?? tagId;
  const statuses = [
    { value: 'all', label: t('shared.allStatuses') },
    { value: 'enabled', label: t('shared.enabled') },
    { value: 'disabled', label: t('shared.disabled') },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row">
        <ListSearch search={search} placeholder={searchPlaceholder} onSearch={onSearch} />
        <Select
          value={status}
          items={statuses}
          onValueChange={(value) => {
            if (value === 'all' || value === 'enabled' || value === 'disabled') {
              onStatusChange(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label={t('shared.status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tagId ?? allTags.value}
          items={tagItems}
          onValueChange={(value) => onTagChange(value && value !== allTags.value ? value : undefined)}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label={t('shared.tags')} aria-busy={tagStatus === 'loading'}>
            <SelectValue className={tagId ? 'min-w-0' : undefined}>
              {tagId && <span className="truncate">{selectedTagLabel}</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false}>
            <SelectItem value={allTags.value}>{allTags.label}</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id} className="[&>*:first-child]:min-w-0 [&>*:first-child]:shrink">
                <TagBadge tag={tag} />
              </SelectItem>
            ))}
            {tagStatus !== 'ready' && (
              <SelectItem
                value={tagStatus}
                disabled
                className="[&>*:first-child]:shrink [&>*:first-child]:whitespace-normal"
              >
                {t(`admin.settings.system.tags.shared.${tagStatus === 'loading' ? 'loading' : 'loadError'}`)}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                disabled={loading || refreshDisabled}
                onClick={() => {
                  reloadTags();
                  onRefresh();
                }}
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
