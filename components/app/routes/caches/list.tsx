'use client';
import { Ban, ExternalLink, LoaderCircle, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { ListActions, ListActionTrigger } from '@/components/business/list-actions';
import { RouteRecordList } from '@/components/business/record-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RouteStatusActions } from '@/hooks/use-route-list';
import type { CacheListItem } from '@/lib/types/routes';
import { RouteDelete } from '../route-delete';
import type { RouteDrawerProps } from '../route-drawer';
import { RouteListTitle } from '../route-list-title';
import { RouteStatus } from '../route-status';

export function CacheList({
  drawer: Drawer,
  items,
  loading,
  initialLoading,
  filtered,
  onUpdated,
  onRemove,
  statusActions,
  selectedIds,
  onSelect,
  onSelectAll,
  actionsDisabled,
}: {
  drawer: ComponentType<RouteDrawerProps>;
  items: readonly CacheListItem[];
  loading: boolean;
  initialLoading: boolean;
  filtered: boolean;
  onUpdated: () => void;
  onRemove: (id: string) => Promise<boolean>;
  statusActions: RouteStatusActions;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
}) {
  const t = useTranslations();

  return (
    <RouteRecordList
      items={items}
      shortcutType="cache"
      pathnameLabel={t('admin.routes.shared.columns.pathname')}
      detailColumns={[
        {
          label: t('admin.routes.caches.columns.upstream'),
          width: 'minmax(0, 1.5fr)',
          render: (cache) => (
            <a
              href={cache.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/upstream focus-visible:ring-ring inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-xs outline-none focus-visible:ring-2 @lg:max-w-72"
              title={cache.url}
              aria-label={t('admin.routes.caches.openUpstream', { url: cache.url })}
            >
              <span className="min-w-0 truncate">{cache.url}</span>
              <ExternalLink
                aria-hidden="true"
                className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/upstream:opacity-100 group-focus-visible/upstream:opacity-100"
              />
            </a>
          ),
        },
        {
          label: t('admin.routes.caches.columns.method'),
          width: '4.5rem',
          render: (cache) => <Badge variant="outline">{cache.method}</Badge>,
        },
      ]}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.routes.caches.loading')}
      emptyLabel={t(filtered ? 'admin.routes.caches.emptyFiltered' : 'admin.routes.caches.empty')}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(cache) => ({
        title: <RouteListTitle drawer={Drawer} item={cache} disabled={actionsDisabled} onUpdated={onUpdated} />,
        status: <RouteStatus enabled={cache.status} label={t(cache.status ? 'shared.enabled' : 'shared.disabled')} />,
        actions: (
          <ListActions disabled={actionsDisabled}>
            <Drawer id={cache.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <Drawer copyFromId={cache.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <CacheStatusAction cache={cache} statusActions={statusActions} disabled={actionsDisabled} />
            <RouteDelete
              label={t('shared.delete')}
              description={t('admin.routes.shared.deleteConfirmation', { name: cache.name })}
              disabled={actionsDisabled}
              onRemove={() => onRemove(cache.id)}
            />
          </ListActions>
        ),
      })}
    />
  );
}

function CacheStatusAction({
  cache,
  statusActions,
  disabled,
}: {
  cache: CacheListItem;
  statusActions: RouteStatusActions;
  disabled: boolean;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const submitting = statusActions.pendingIds.has(cache.id);
  const error = statusActions.errors[cache.id] ?? '';

  function clearError() {
    statusActions.clearError(cache.id);
  }

  async function changeStatus() {
    if (await statusActions.changeStatus(cache.id)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {cache.status ? (
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!submitting && (!nextOpen || !disabled)) {
              setOpen(nextOpen);
              clearError();
            }
          }}
        >
          <Tooltip>
            <DialogTrigger
              render={<TooltipTrigger render={<ListActionTrigger disabled={disabled} label={t('shared.disable')} />} />}
            >
              <Ban />
            </DialogTrigger>
            <TooltipContent side="top">{t('shared.disable')}</TooltipContent>
          </Tooltip>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{t('admin.routes.shared.disableTitle')}</DialogTitle>
              <DialogDescription className="break-words">
                {t('admin.routes.shared.disableConfirmation', { name: cache.name })}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" disabled={submitting} onClick={() => setOpen(false)}>
                {t('shared.cancel')}
              </Button>
              <Button disabled={submitting || disabled} onClick={() => void changeStatus()}>
                {submitting && <LoaderCircle className="animate-spin" />}
                {t('shared.disable')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <ListActionTrigger
                  disabled={submitting || disabled}
                  label={t('shared.enable')}
                  onClick={() => void changeStatus()}
                />
              }
            >
              {submitting ? <LoaderCircle className="animate-spin" /> : <Play />}
            </TooltipTrigger>
            <TooltipContent side="top">{t('shared.enable')}</TooltipContent>
          </Tooltip>
          {error && (
            <p role="alert" className="text-destructive max-w-48 text-xs whitespace-normal">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
