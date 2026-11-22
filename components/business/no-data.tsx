import { useTranslations } from 'next-intl';
import { Empty, EmptyDescription } from '@/components/ui/empty';

export function NoData() {
  const t = useTranslations();

  return (
    <Empty role="status" className="p-0">
      <EmptyDescription>{t('shared.noData')}</EmptyDescription>
    </Empty>
  );
}
