'use client';

import { Ban, CircleCheck, CircleSlash, LoaderCircle, Play, Trash2, Workflow } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
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
import type { SubscriptionListItem, SubscriptionStatusActions } from '@/lib/types/subscriptions';

export interface SubscriptionDrawerProps {
  id?: string;
  copyFromId?: string;
  onSaved: () => void;
  disabled?: boolean;
  trigger?: ReactElement;
  triggerLabel?: string;
}

export function SubscriptionList({
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
  drawer: ComponentType<SubscriptionDrawerProps>;
  items: readonly SubscriptionListItem[];
  loading: boolean;
  initialLoading: boolean;
  emptyAction: ReactNode;
  onUpdated: () => void;
  onRemove: (id: string) => Promise<void>;
  statusActions: SubscriptionStatusActions;
  selectedIds: readonly string[];
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  actionsDisabled: boolean;
}) {
  const t = useTranslations();

  return (
    <RouteRecordList
      items={items}
      shortcutType="subscription"
      pathnameLabel={t('admin.application.subscriptions.columns.pathname')}
      loading={loading}
      initialLoading={initialLoading}
      loadingLabel={t('admin.application.subscriptions.loading')}
      emptyAction={emptyAction}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onSelectAll={onSelectAll}
      actionsDisabled={actionsDisabled}
      renderItem={(subscription) => ({
        title: (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="link"
                  size="sm"
                  className="block h-auto max-w-full cursor-pointer truncate p-0 text-left font-medium hover:no-underline"
                  disabled={actionsDisabled}
                  nativeButton={false}
                  render={<Link href={`/application/subscriptions/workflow/${encodeURIComponent(subscription.id)}`} />}
                />
              }
            >
              {subscription.name}
            </TooltipTrigger>
            <TooltipContent side="top" className="break-words whitespace-pre-wrap">
              {subscription.description || subscription.name}
            </TooltipContent>
          </Tooltip>
        ),
        status: (
          <SubscriptionStatus
            enabled={subscription.status}
            label={t(subscription.status ? 'shared.enabled' : 'shared.disabled')}
          />
        ),
        actions: (
          <ListActions disabled={actionsDisabled}>
            <Drawer id={subscription.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <ListActionTrigger
              disabled={actionsDisabled}
              href={`/application/subscriptions/workflow/${encodeURIComponent(subscription.id)}`}
              label={t('admin.application.subscriptions.configure')}
            >
              <Workflow />
            </ListActionTrigger>
            <Drawer copyFromId={subscription.id} onSaved={onUpdated} disabled={actionsDisabled} />
            <SubscriptionStatusAction
              subscription={subscription}
              statusActions={statusActions}
              disabled={actionsDisabled}
            />
            <SubscriptionDelete
              disabled={actionsDisabled}
              name={subscription.name}
              onConfirm={() => onRemove(subscription.id)}
            />
          </ListActions>
        ),
      })}
    />
  );
}

function SubscriptionStatusAction({
  subscription,
  statusActions,
  disabled,
}: {
  subscription: SubscriptionListItem;
  statusActions: SubscriptionStatusActions;
  disabled: boolean;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const submitting = statusActions.pendingIds.has(subscription.id);
  const error = statusActions.errors[subscription.id] ?? '';

  function clearError() {
    statusActions.clearError(subscription.id);
  }

  async function changeStatus() {
    if (await statusActions.changeStatus(subscription.id)) {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      {subscription.status ? (
        <Dialog
          modal
          disablePointerDismissal
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
              <DialogTitle>{t('admin.application.subscriptions.disableTitle')}</DialogTitle>
              <DialogDescription className="break-words">
                {t('admin.application.subscriptions.disableConfirmation', { name: subscription.name })}
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

function SubscriptionStatus({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span role="img" aria-label={label} className="inline-flex align-middle" />}>
        {enabled ? (
          <CircleCheck aria-hidden="true" className="size-5 text-green-500 dark:text-green-400" />
        ) : (
          <CircleSlash aria-hidden="true" className="text-muted-foreground size-5" />
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function SubscriptionDelete({
  disabled,
  name,
  label,
  onConfirm,
}: {
  disabled: boolean;
  name?: string;
  label?: string;
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  async function confirm() {
    if (pending.current || disabled) {
      return;
    }

    pending.current = true;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm();
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('admin.application.subscriptions.deleteError'));
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      modal
      disablePointerDismissal
      open={open}
      onOpenChange={(value) => {
        if (!submitting) {
          setOpen(value);
          setError('');
        }
      }}
    >
      {label ? (
        <DialogTrigger render={<Button variant="destructive" disabled={disabled} />}>{label}</DialogTrigger>
      ) : (
        <Tooltip>
          <DialogTrigger
            render={
              <TooltipTrigger
                render={<ListActionTrigger destructive disabled={disabled} label={t('shared.delete')} />}
              />
            }
          >
            <Trash2 />
          </DialogTrigger>
          <TooltipContent side="top">{t('shared.delete')}</TooltipContent>
        </Tooltip>
      )}
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('admin.application.subscriptions.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {name
              ? t('admin.application.subscriptions.deleteConfirmation', { name })
              : t('admin.application.subscriptions.deleteSelectedConfirmation')}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => setOpen(false)}>
            {t('shared.cancel')}
          </Button>
          <Button type="button" disabled={disabled || submitting} onClick={() => void confirm()}>
            {submitting && <LoaderCircle className="animate-spin" />}
            {t('shared.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
