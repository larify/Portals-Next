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
import { ROUTE_ICONS } from '@/lib/constants/routes';
import type { RouteType } from '@/lib/constants/routes';
import type { AnalyticsRecentLimit, AnalyticsVisit } from '@/lib/types/analytics';
import type { DashboardQuery } from '@/lib/types/dashboard';

const RECENT_DESKTOP_COLUMNS =
  '@4xl/recent:grid-cols-[3rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_6rem_5rem_5.5rem]';

function RecentList({ items, routeType }: { items: AnalyticsVisit[]; routeType: RouteType }) {
  const t = useTranslations('admin.analytics');
  const formatDateTime = usePreferences((value) => value.formatDateTime);
  const Icon = ROUTE_ICONS[routeType];

  if (!items.length) {
    return <NoData />;
  }

  return (
    <>
      <div
        className={`text-muted-foreground mb-2 hidden min-h-8 items-center gap-x-3 px-3 text-sm font-medium @4xl/recent:grid ${RECENT_DESKTOP_COLUMNS}`}
      >
        <span aria-hidden="true" />
        <span>{t('entries')}</span>
        <span>{t('ip')}</span>
        <span>{t('client')}</span>
        <span>{t('visitAt')}</span>
        <span>{t('responses')}</span>
        <span>{t('errorCode')}</span>
        <span className="text-right">{t('duration')}</span>
      </div>
      <ol role="list" className="space-y-4">
        {items.map((visit) => {
          const client = [visit.os, visit.browser, visit.device].filter(Boolean).join(' / ');
          const failed = (visit.statusCode ?? 0) >= 400 || visit.errorCode !== null;

          return (
            <li
              key={visit.id}
              className={`bg-muted/55 hover:bg-muted grid min-h-17.5 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 rounded-lg p-3 transition-colors @4xl/recent:gap-x-3 ${RECENT_DESKTOP_COLUMNS}`}
            >
              <div className="border-border grid size-10 place-items-center rounded-lg border @lg/recent:size-12">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div className="text-muted-foreground min-w-0 text-xs @max-4xl/recent:space-y-1 @4xl/recent:contents">
                <p className="text-foreground text-sm font-medium wrap-anywhere">{visit.entry ?? t('unrecorded')}</p>
                <p className="font-mono wrap-anywhere">
                  <span className="sr-only">{t('ip')} </span>
                  {visit.ip ?? t('unrecorded')}
                </p>
                <p className="wrap-anywhere">
                  <span className="sr-only">{t('client')} </span>
                  {client || t('unrecognized')}
                </p>
              </div>
              <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs @max-4xl/recent:col-span-2 @max-4xl/recent:col-start-2 @max-4xl/recent:row-start-2 @4xl/recent:contents">
                <time dateTime={new Date(visit.visitAt).toISOString()} className="tabular-nums">
                  <span className="sr-only">{t('visitAt')} </span>
                  {formatDateTime(visit.visitAt)}
                </time>
                <Badge variant={failed ? 'destructive' : 'outline'} className="justify-self-start tabular-nums">
                  {visit.statusCode === null ? t('unrecorded') : `HTTP ${visit.statusCode}`}
                </Badge>
                {visit.errorCode === null ? (
                  <span className="hidden @4xl/recent:block">—</span>
                ) : (
                  <span className="tabular-nums">
                    <span className="sr-only">{t('errorCode')} </span>
                    {visit.errorCode}
                  </span>
                )}
              </div>
              <div className="min-w-0 text-right @max-4xl/recent:col-start-3 @max-4xl/recent:row-start-1">
                <div className="text-muted-foreground text-xs @4xl/recent:sr-only">{t('duration')}</div>
                <div className="font-medium whitespace-nowrap tabular-nums">
                  {t('milliseconds', { value: visit.duration })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
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
