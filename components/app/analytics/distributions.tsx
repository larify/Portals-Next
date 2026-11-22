'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { NoData } from '@/components/business/no-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AnalyticsCount, AnalyticsDetail } from '@/lib/types/analytics';

function DistributionRows({
  items,
  total,
  other,
  unknown,
  wrap = false,
}: {
  items: AnalyticsCount[];
  total: number;
  other: number;
  unknown: string;
  wrap?: boolean;
}) {
  const t = useTranslations('admin.analytics');
  const format = useFormatter();
  const rows = other ? [...items, { label: t('other'), count: other }] : items;

  if (!total) {
    return <NoData />;
  }

  return (
    <ScrollArea className="max-h-60 [&>[data-slot=scroll-area-viewport]]:max-h-[inherit]">
      <ul className="space-y-3 pr-3">
        {rows.map(({ label, count }, index) => (
          <li
            key={index === items.length ? 'other' : label === null ? 'unknown' : `label:${label}`}
            className="space-y-1.5"
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              {wrap ? (
                <span className="min-w-0 font-mono text-xs wrap-anywhere">{label ?? unknown}</span>
              ) : (
                <Tooltip>
                  <TooltipTrigger render={<span className="min-w-0 truncate text-sm font-medium" />}>
                    {label ?? unknown}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm break-all">
                    {label ?? unknown}
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex shrink-0 items-center gap-2 text-right text-xs tabular-nums">
                <span className="font-medium">{format.number(count)}</span>
                <span className="text-muted-foreground min-w-11">
                  {format.number(count / total, { style: 'percent', maximumFractionDigits: 1 })}
                </span>
              </div>
            </div>
            <div aria-hidden="true" className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function AnalyticsEntries({ data }: { data: AnalyticsDetail }) {
  const t = useTranslations('admin.analytics');

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2>{t('entries')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-24 flex-1">
        <DistributionRows
          items={data.entries.address.items}
          other={data.entries.address.other}
          total={data.requests}
          unknown={t('unrecorded')}
          wrap
        />
      </CardContent>
    </Card>
  );
}

export function AnalyticsIps({ data }: { data: AnalyticsDetail }) {
  const t = useTranslations('admin.analytics');
  const { ips } = data;
  const items: AnalyticsCount[] = [...ips.items];

  if (ips.unknown) {
    items.push({ label: null, count: ips.unknown });
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2>{t('ipRanking')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-24 flex-1">
        <DistributionRows items={items} other={ips.other} total={data.requests} unknown={t('unrecorded')} />
      </CardContent>
    </Card>
  );
}
