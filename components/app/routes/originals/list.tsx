'use client';
import { Ban, LoaderCircle, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import { ListActions, ListActionTrigger } from '@/components/business/list-actions';
import { RouteRecordList } from '@/components/business/record-list';
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
import type { OriginalListItem } from '@/lib/types/routes';
import { RouteDelete } from '../route-delete';
import type { RouteDrawerProps } from '../route-drawer';
import { RouteListTitle } from '../route-list-title';
import { RouteStatus } from '../route-status';

export function OriginalList({
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
  items: readonly OriginalListItem[];
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
      shortcutType="original"
      pathnameLabel={t('admin.routes.shared.columns.pathname')}
      detailColumns={[
        {
          label: t('admin.routes.originals.form.contentType'),
          width: 'minmax(0, 1.5fr)',
          render: (original) => (
            <span className="block max-w-full min-w-0 truncate @lg:max-w-72" title={original.contentType}>
              {original.contentType}
            </span>
          ),
        },
      ]}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.routes.originals.loading')}
      emptyAction={emptyAction}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(original) => ({
        title: <RouteListTitle drawer={Drawer} item={original} disabled={actionsDisabled} onUpdated={onUpdated} />,
        status: (
          <RouteStatus enabled={original.status} label={t(original.status ? 'shared.enabled' : 'shared.disabled')} />
        ),
        actions: (
          <ListActions disabled={actionsDisabled}>
            <Drawer id={original.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <Drawer copyFromId={original.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <OriginalStatusAction original={original} statusActions={statusActions} disabled={actionsDisabled} />
            <RouteDelete
              label={t('shared.delete')}
              description={t('admin.routes.shared.deleteConfirmation', { name: original.name })}
              disabled={actionsDisabled}
              onRemove={() => onRemove(original.id)}
            />
          </ListActions>
        ),
      })}
    />
  );
}

function OriginalStatusAction({
  original,
  statusActions,
  disabled,
}: {
  original: OriginalListItem;
  statusActions: RouteStatusActions;
  disabled: boolean;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const submitting = statusActions.pendingIds.has(original.id);
  const error = statusActions.errors[original.id] ?? '';

  function clearError() {
    statusActions.clearError(original.id);
  }

  async function changeStatus() {
    if (await statusActions.changeStatus(original.id)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {original.status ? (
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
                {t('admin.routes.shared.disableConfirmation', { name: original.name })}
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
