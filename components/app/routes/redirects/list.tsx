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
import type { RedirectListItem } from '@/lib/types/routes';
import { RouteDelete as RemoveAction } from '../route-delete';
import type { RouteDrawerProps } from '../route-drawer';
import { RouteListTitle } from '../route-list-title';
import { RouteStatus } from '../route-status';

export function RedirectList({
  drawer: Drawer,
  items,
  loading,
  initialLoading,
  filtered,
  onUpdated,
  statusActions,
  onRemove,
  selectedIds,
  onSelect,
  onSelectAll,
  actionsDisabled,
}: {
  drawer: ComponentType<RouteDrawerProps>;
  items: readonly RedirectListItem[];
  loading: boolean;
  initialLoading: boolean;
  filtered: boolean;
  onUpdated: () => void;
  statusActions: RouteStatusActions;
  onRemove: (id: string) => Promise<boolean>;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
}) {
  const t = useTranslations();

  return (
    <RouteRecordList
      items={items}
      shortcutType="redirect"
      pathnameLabel={t('admin.routes.shared.columns.pathname')}
      detailColumns={[
        {
          label: t('admin.routes.redirects.shared.destination'),
          width: 'minmax(0, 1.5fr)',
          render: (redirect) => (
            <a
              href={redirect.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/destination focus-visible:ring-ring inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-xs outline-none focus-visible:ring-2 @lg:max-w-72"
              title={redirect.url}
              aria-label={t('admin.routes.redirects.openDestination', { url: redirect.url })}
            >
              <span className="min-w-0 truncate">{redirect.url}</span>
              <ExternalLink
                aria-hidden="true"
                className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/destination:opacity-100 group-focus-visible/destination:opacity-100"
              />
            </a>
          ),
        },
        {
          label: t('admin.routes.redirects.shared.statusCode'),
          width: '4.5rem',
          render: (redirect) => <Badge variant="outline">{redirect.statusCode}</Badge>,
        },
      ]}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.routes.redirects.loading')}
      emptyLabel={t(filtered ? 'admin.routes.redirects.emptyFiltered' : 'admin.routes.redirects.empty')}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(redirect) => ({
        title: <RouteListTitle drawer={Drawer} item={redirect} disabled={actionsDisabled} onUpdated={onUpdated} />,
        status: (
          <RouteStatus enabled={redirect.status} label={t(redirect.status ? 'shared.enabled' : 'shared.disabled')} />
        ),
        actions: (
          <ListActions disabled={actionsDisabled}>
            <Drawer id={redirect.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <Drawer copyFromId={redirect.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <RedirectStatusAction redirect={redirect} statusActions={statusActions} disabled={actionsDisabled} />
            <RemoveAction
              label={t('shared.delete')}
              description={t('admin.routes.shared.deleteConfirmation', { name: redirect.name })}
              onRemove={() => onRemove(redirect.id)}
              disabled={actionsDisabled}
            />
          </ListActions>
        ),
      })}
    />
  );
}

function RedirectStatusAction({
  redirect,
  statusActions,
  disabled,
}: {
  redirect: RedirectListItem;
  statusActions: RouteStatusActions;
  disabled: boolean;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const submitting = statusActions.pendingIds.has(redirect.id);
  const error = statusActions.errors[redirect.id] ?? '';

  function clearError() {
    statusActions.clearError(redirect.id);
  }

  async function changeStatus() {
    if (await statusActions.changeStatus(redirect.id)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {redirect.status ? (
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
                {t('admin.routes.shared.disableConfirmation', { name: redirect.name })}
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
