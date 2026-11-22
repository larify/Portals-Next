'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { NoData } from '@/components/business/no-data';
import { Card } from '@/components/ui/card';
import type { AnalyticsDetail as AnalyticsDetailData } from '@/lib/types/analytics';

export function AnalyticsMetrics({ data }: { data: AnalyticsDetailData }) {
  const t = useTranslations('admin.analytics');
  const format = useFormatter();
  const metrics = [
    { key: 'requests', value: format.number(data.requests) },
    { key: 'uniqueIps', value: format.number(data.uniqueIps) },
    {
      key: 'successRate',
      value: data.requests
        ? format.number(data.successes / data.requests, { style: 'percent', maximumFractionDigits: 2 })
        : null,
    },
    { key: 'p95', value: data.p95 === null ? null : t('milliseconds', { value: data.p95 }) },
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.key} size="sm" className="gap-1.5 px-4">
          <dt className="text-muted-foreground text-sm font-medium">{t(metric.key)}</dt>
          {metric.value === null ? (
            <dd className="flex min-h-8 flex-1 flex-col">
              <NoData />
            </dd>
          ) : (
            <dd className="text-2xl font-semibold tabular-nums">{metric.value}</dd>
          )}
        </Card>
      ))}
    </dl>
  );
}
