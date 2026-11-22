'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/business/page-header';
import { TagDrawer } from './drawer';

export function TagHeader({ onCreated, disabled }: { onCreated: () => void; disabled: boolean }) {
  const t = useTranslations('admin.settings.system.tags');

  return (
    <PageHeader titleId="system-tags-title" title={t('title')} description={t('description')}>
      <TagDrawer onSaved={onCreated} disabled={disabled} />
    </PageHeader>
  );
}
