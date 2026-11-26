'use client';
import { Ban, ExternalLink, LoaderCircle, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType, ReactNode } from 'react';
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
import type { ProxyListItem } from '@/lib/types/routes';
import { RouteDelete } from '../route-delete';
import type { RouteDrawerProps } from '../route-drawer';
import { RouteListTitle } from '../route-list-title';
import { RouteStatus } from '../route-status';

export function ProxyList({
  drawer: Drawer,
  items,
  loading,
  initialLoading,
  emptyAction,
  onUpdated,
  onRemove,
  statusActions,
  selectedIds,
  onSelect,
  onSelectAll,
  actionsDisabled,
}: {
  drawer: ComponentType<RouteDrawerProps>;
  items: readonly ProxyListItem[];
  loading: boolean;
  initialLoading: boolean;
  emptyAction: ReactNode;
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
      shortcutType="proxy"
      pathnameLabel={t('admin.routes.shared.columns.pathname')}
      detailColumns={[
        {
          label: t('admin.routes.proxies.columns.upstream'),
          width: 'minmax(0, 1.5fr)',
          render: (proxy) => (
            <a
              href={proxy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/upstream focus-visible:ring-ring inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-xs outline-none focus-visible:ring-2 @lg:max-w-72"
              title={proxy.url}
              aria-label={t('admin.routes.proxies.openUpstream', { url: proxy.url })}
            >
              <span className="min-w-0 truncate">{proxy.url}</span>
              <ExternalLink
                aria-hidden="true"
                className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/upstream:opacity-100 group-focus-visible/upstream:opacity-100"
              />
            </a>
          ),
        },
        {
          label: t('admin.routes.proxies.columns.method'),
          width: '4.5rem',
          render: (proxy) => <Badge variant="outline">{proxy.method}</Badge>,
        },
      ]}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.routes.proxies.loading')}
      emptyAction={emptyAction}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(proxy) => ({
        title: <RouteListTitle drawer={Drawer} item={proxy} disabled={actionsDisabled} onUpdated={onUpdated} />,
        status: <RouteStatus enabled={proxy.status} label={t(proxy.status ? 'shared.enabled' : 'shared.disabled')} />,
        actions: (
          <ListActions disabled={actionsDisabled}>
            <Drawer id={proxy.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <Drawer copyFromId={proxy.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <ProxyStatusAction proxy={proxy} statusActions={statusActions} disabled={actionsDisabled} />
            <RouteDelete
              label={t('shared.delete')}
              description={t('admin.routes.shared.deleteConfirmation', { name: proxy.name })}
              disabled={actionsDisabled}
              onRemove={() => onRemove(proxy.id)}
            />
          </ListActions>
        ),
      })}
    />
  );
}

function ProxyStatusAction({
  proxy,
  statusActions,
  disabled,
}: {
  proxy: ProxyListItem;
  statusActions: RouteStatusActions;
  disabled: boolean;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const submitting = statusActions.pendingIds.has(proxy.id);
  const error = statusActions.errors[proxy.id] ?? '';

  function clearError() {
    statusActions.clearError(proxy.id);
  }

  async function changeStatus() {
    if (await statusActions.changeStatus(proxy.id)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {proxy.status ? (
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
                {t('admin.routes.shared.disableConfirmation', { name: proxy.name })}
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
