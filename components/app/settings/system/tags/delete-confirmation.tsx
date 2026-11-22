'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';
import { useState } from 'react';
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

export type TagDeleteResult = { success: boolean; message?: string };

export function TagDeleteConfirmation({
  description,
  trigger,
  disabled,
  pending,
  onConfirm,
}: {
  description: string;
  trigger: ReactElement;
  disabled: boolean;
  pending: boolean;
  onConfirm: () => Promise<TagDeleteResult>;
}) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (pending || disabled) {
      return;
    }

    setError('');

    try {
      const result = await onConfirm();

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.message || t('admin.settings.system.tags.deleteError'));
      }
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message ? reason.message : t('admin.settings.system.tags.deleteError'),
      );
    }
  }

  return (
    <Dialog
      modal
      disablePointerDismissal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending && (!nextOpen || !disabled)) {
          setOpen(nextOpen);
          setError('');
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('shared.deleteTitle')}</DialogTitle>
          <DialogDescription className="break-words">{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            {t('shared.cancel')}
          </Button>
          <Button disabled={pending || disabled} onClick={() => void confirm()}>
            {pending && <LoaderCircle className="animate-spin" />}
            {t('shared.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
