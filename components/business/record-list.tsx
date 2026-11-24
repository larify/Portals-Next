'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreferences } from '@/hooks/use-preferences';
import type { ShortcutType } from '@/lib/types/shortcuts';
import type { TagOption } from '@/lib/types/tag';
import { PathnameLink } from './pathname-link';
import { TagList } from './tag-list';

interface RecordListItem {
  id: string;
  updatedAt: string;
}

interface RouteRecordListItem extends RecordListItem {
  name: string;
  pathname: string;
  tags: readonly TagOption[];
}

interface RecordListItemContent {
  title: ReactNode;
  status?: ReactNode;
  actions: ReactNode;
}

interface RecordListColumn<Item> {
  label: string;
  width: string;
  render: (item: Item) => ReactNode;
}

interface RecordListProps<Item> {
  items: readonly Item[];
  getItemName: (item: Item) => string;
  secondaryColumn: RecordListColumn<Item>;
  detailColumns?: readonly RecordListColumn<Item>[];
  statusLabel?: string;
  loading: boolean;
  initialLoading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
  renderItem: (item: Item) => RecordListItemContent;
}

export function RecordList<Item extends RecordListItem>({
  items,
  getItemName,
  secondaryColumn,
  detailColumns = [],
  statusLabel,
  loading,
  initialLoading,
  loadingLabel,
  emptyLabel,
  selectedIds,
  onSelect,
  onSelectAll,
  actionsDisabled,
  renderItem,
}: RecordListProps<Item>) {
  const t = useTranslations();
  const selectAllId = useId();
  const formatDateTime = usePreferences((state) => state.formatDateTime);
  const selected = new Set(selectedIds);
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const columns = [
    '2.5rem',
    'minmax(0, 1fr)',
    secondaryColumn.width,
    ...detailColumns.map((column) => column.width),
    ...(statusLabel ? ['3.5rem'] : []),
    '9.5rem',
    '4.5rem',
  ].join(' ');
  const gridStyle: CSSProperties & { '--record-list-columns': string } = { '--record-list-columns': columns };

  if (initialLoading) {
    return (
      <div role="status">
        <span className="sr-only">{loadingLabel}</span>
        <div className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="@container relative min-w-0" style={gridStyle}>
      {loading && (
        <div
          role="progressbar"
          aria-label={loadingLabel}
          className="bg-primary/10 pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-full"
        >
          <div className="bg-primary animate-loading-progress h-full w-[35%] motion-reduce:w-full motion-reduce:animate-none" />
        </div>
      )}
      <div aria-busy={loading}>
        {items.length === 0 ? (
          <p role="status" className="text-muted-foreground py-8 text-center text-sm">
            {emptyLabel}
          </p>
        ) : (
          <>
            <div className="mb-2 flex min-h-8 items-center gap-2 px-3 @4xl:grid @4xl:grid-cols-(--record-list-columns) @4xl:gap-x-3">
              <div className="flex items-center gap-2 @4xl:justify-center">
                <Checkbox
                  id={selectAllId}
                  checked={allSelected}
                  indeterminate={selected.size > 0 && !allSelected}
                  disabled={actionsDisabled}
                  onCheckedChange={onSelectAll}
                />
                <Label htmlFor={selectAllId} className="@4xl:sr-only">
                  {t('shared.selectAll')}
                </Label>
              </div>
              <div className="text-muted-foreground hidden text-sm font-medium @4xl:contents">
                <span>{t('shared.name')}</span>
                <span>{secondaryColumn.label}</span>
                {detailColumns.map((column) => (
                  <span key={column.label}>{column.label}</span>
                ))}
                {statusLabel && <span className="text-center">{statusLabel}</span>}
                <span>{t('shared.updatedAt')}</span>
                <span className="text-center">{t('shared.actions')}</span>
              </div>
            </div>
            <ul role="list" className="space-y-4">
              {items.map((item) => {
                const { title, status, actions } = renderItem(item);

                return (
                  <li
                    key={item.id}
                    className="bg-muted/55 hover:bg-muted grid min-h-17.5 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg p-3 transition-colors @lg:gap-x-4 @4xl:grid-cols-(--record-list-columns) @4xl:gap-x-3"
                  >
                    <div className="grid size-9 place-items-center @max-4xl:col-start-1 @max-4xl:row-span-2 @max-4xl:row-start-1 @lg:size-10">
                      <Checkbox
                        className="bg-muted-foreground/35 dark:bg-muted-foreground/35 border-0 shadow-none"
                        aria-label={t('shared.selectRow', { name: getItemName(item) })}
                        checked={selected.has(item.id)}
                        disabled={actionsDisabled}
                        onCheckedChange={(checked) => onSelect(item.id, checked)}
                      />
                    </div>
                    <div className="min-w-0 @max-4xl:col-start-2 @max-4xl:row-start-1 @max-4xl:self-end">{title}</div>
                    <div className="min-w-0 @max-4xl:col-start-2 @max-4xl:row-start-2 @max-4xl:self-start">
                      {secondaryColumn.render(item)}
                    </div>
                    <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs @max-4xl:col-span-2 @max-4xl:col-start-2 @max-4xl:row-start-3 @max-4xl:mt-2 @4xl:contents">
                      {detailColumns.map((column) => (
                        <div key={column.label} className="max-w-full min-w-0 empty:hidden @4xl:empty:block">
                          {column.render(item)}
                        </div>
                      ))}
                      <time dateTime={item.updatedAt} className="tabular-nums @4xl:order-2">
                        {formatDateTime(item.updatedAt)}
                      </time>
                    </div>
                    {statusLabel && (
                      <div className="flex justify-center @max-4xl:col-start-3 @max-4xl:row-start-1 @max-4xl:justify-end @4xl:order-1">
                        {status}
                      </div>
                    )}
                    <div
                      className={`@max-4xl:col-start-3 @max-4xl:justify-self-end @4xl:order-3 ${statusLabel ? '@max-4xl:row-start-2' : '@max-4xl:row-span-2 @max-4xl:row-start-1'}`}
                    >
                      {actions}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export function RouteRecordList<Item extends RouteRecordListItem>({
  shortcutType,
  pathnameLabel,
  detailColumns = [],
  ...props
}: Omit<RecordListProps<Item>, 'getItemName' | 'secondaryColumn' | 'statusLabel'> & {
  shortcutType: ShortcutType;
  pathnameLabel: string;
}) {
  const t = useTranslations();

  return (
    <RecordList
      {...props}
      getItemName={(item) => item.name}
      secondaryColumn={{
        label: pathnameLabel,
        width: 'minmax(0, 1.5fr)',
        render: (item) => <PathnameLink pathname={item.pathname} shortcutType={shortcutType} id={item.id} />,
      }}
      detailColumns={[
        ...detailColumns,
        { label: t('shared.tags'), width: 'minmax(0, 1fr)', render: (item) => <TagList tags={item.tags} /> },
      ]}
      statusLabel={t('shared.status')}
    />
  );
}
