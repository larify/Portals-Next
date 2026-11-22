'use client';

import { useTranslations } from 'next-intl';
import { QueryFeedback } from '@/components/app/dashboard/query-feedback';
import { NoData } from '@/components/business/no-data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreferences } from '@/hooks/use-preferences';
import { ANALYTICS_RECENT_LIMITS } from '@/lib/constants/analytics';
import { ROUTE_ICONS } from '@/lib/constants/route-icons';
import type { RouteType } from '@/lib/constants/routes';
import type { AnalyticsRecentLimit, AnalyticsVisit } from '@/lib/types/analytics';
import type { DashboardQuery } from '@/lib/types/dashboard';

function RecentList({ items, routeType }: { items: AnalyticsVisit[]; routeType: RouteType }) {
  const t = useTranslations('admin.analytics');
  const formatDateTime = usePreferences((value) => value.formatDateTime);
  const Icon = ROUTE_ICONS[routeType];

  if (!items.length) {
    return <NoData />;
  }

  return (
    <ol role="list" className="space-y-4">
      {items.map((visit) => {
        const client = [visit.os, visit.browser, visit.device].filter(Boolean).join(' / ');
        const failed = (visit.statusCode ?? 0) >= 400 || visit.errorCode !== null;

        return (
          <li
            key={visit.id}
            className="bg-muted/55 hover:bg-muted grid min-h-17.5 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-lg p-3 transition-colors @lg/recent:gap-x-4 @2xl/recent:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
          >
            <div className="border-border col-start-1 row-span-2 row-start-1 grid size-10 place-items-center rounded-lg border @lg/recent:size-12">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <div className="col-start-2 row-span-2 row-start-1 min-w-0 space-y-1.5">
              <p className="font-medium wrap-anywhere">{visit.entry ?? t('unrecorded')}</p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="font-mono wrap-anywhere">
                  <span className="sr-only">{t('ip')} </span>
                  {visit.ip ?? t('unrecorded')}
                </span>
                <span className="wrap-anywhere">
                  <span className="sr-only">{t('client')} </span>
                  {client || t('unrecognized')}
                </span>
              </div>
            </div>
            <div className="col-start-2 flex flex-col items-end gap-1 text-right @2xl/recent:col-start-3 @2xl/recent:row-span-2 @2xl/recent:row-start-1">
              <time
                dateTime={new Date(visit.visitAt).toISOString()}
                className="text-muted-foreground text-xs tabular-nums"
              >
                <span className="sr-only">{t('visitAt')} </span>
                {formatDateTime(visit.visitAt)}
              </time>
              <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                {visit.errorCode !== null && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    <span className="sr-only">{t('errorCode')} </span>
                    {visit.errorCode}
                  </span>
                )}
                <Badge variant={failed ? 'destructive' : 'outline'} className="tabular-nums">
                  {visit.statusCode === null ? t('unrecorded') : `HTTP ${visit.statusCode}`}
                </Badge>
              </div>
            </div>
            <div className="col-start-3 row-span-2 row-start-1 min-w-12 text-right @lg/recent:min-w-20 @2xl/recent:col-start-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">{t('duration')}</div>
              <div className="font-medium whitespace-nowrap tabular-nums">
                {t('milliseconds', { value: visit.duration })}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AnalyticsRecent({
  routeType,
  query,
  limit,
  onLimitChange,
}: {
  routeType: RouteType;
  query: DashboardQuery<AnalyticsVisit[]>;
  limit: AnalyticsRecentLimit;
  onLimitChange: (value: AnalyticsRecentLimit) => void;
}) {
  const t = useTranslations('admin.analytics');
  const recent = query.stale ? null : query.data;
  const items = ANALYTICS_RECENT_LIMITS.map((value) => ({ value, label: t('recentCount', { count: value }) }));

  return (
    <Card size="sm" className="@container/recent min-w-0" aria-busy={query.loading}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">
          <h2>{t('recent')}</h2>
        </CardTitle>
        <Select
          value={limit}
          items={items}
          onValueChange={(value) => {
            if (value !== null) {
              onLimitChange(value);
            }
          }}
        >
          <SelectTrigger size="sm" aria-label={t('recentLimit')} className="ml-auto tabular-nums">
            <span className="inline-grid items-center">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                {items.at(-1)?.label}
              </span>
              <SelectValue className="col-start-1 row-start-1" />
            </span>
          </SelectTrigger>
          <SelectContent side="bottom" alignItemWithTrigger={false} className="min-w-0 tabular-nums">
            {items.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="min-h-24 flex-1 gap-4">
        <QueryFeedback query={{ ...query, data: recent, stale: false }} title={t('recentError')} />
        {query.loading && !recent && (
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => index + 1).map((row) => (
              <Skeleton key={row} className="h-17.5 w-full rounded-lg" />
            ))}
          </div>
        )}
        {recent && <RecentList items={recent} routeType={routeType} />}
      </CardContent>
    </Card>
  );
}
