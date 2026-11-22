'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AnalyticsDurations, AnalyticsStatuses, AnalyticsTrend } from '@/components/app/analytics/charts';
import { AnalyticsEntries, AnalyticsIps } from '@/components/app/analytics/distributions';
import { AnalyticsMetrics } from '@/components/app/analytics/metrics';
import { AnalyticsRecent } from '@/components/app/analytics/recent';
import { AnalyticsSkeleton } from '@/components/app/analytics/skeleton';
import { QueryFeedback } from '@/components/app/dashboard/query-feedback';
import { PageHeader } from '@/components/business/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardQuery } from '@/hooks/use-dashboard';
import { getAnalyticsDetail, getAnalyticsVisits } from '@/lib/client/analytics';
import { ANALYTICS_DETAIL_RANGES } from '@/lib/constants/analytics';
import type { RouteType } from '@/lib/constants/routes';
import type { AnalyticsDetailRange, AnalyticsRecentLimit } from '@/lib/types/analytics';

export function AnalyticsDetail({ routeType, id }: { routeType: RouteType; id: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [selection, setSelection] = useState<{ range: AnalyticsDetailRange; to: number }>(() => ({
    range: '24h',
    to: Date.now(),
  }));
  const [limit, setLimit] = useState<AnalyticsRecentLimit>(5);
  const [retainRecent, setRetainRecent] = useState(false);
  const detailParams = useMemo(
    () => ({ routeType, id, ...selection, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    [routeType, id, selection],
  );
  const visitParams = useMemo(() => ({ routeType, id, ...selection, limit }), [routeType, id, selection, limit]);
  const detail = useDashboardQuery(getAnalyticsDetail, detailParams, 0);
  const recent = useDashboardQuery(getAnalyticsVisits, visitParams, 0);
  const data = detail.data;
  const mode = t(`admin.sidebar.${routeType}`);
  const loading = detail.loading || recent.loading;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(routeType === 'subscriptions' ? '/application/subscriptions' : `/routes/${routeType}`);
    }
  }

  return (
    <section className="mx-auto w-full max-w-375 lg:p-2" aria-labelledby="analytics-title">
      <Tabs
        value={selection.range}
        className="gap-0"
        onValueChange={(value) => {
          const range = ANALYTICS_DETAIL_RANGES.find((range) => range === value);

          if (range && range !== selection.range) {
            setRetainRecent(false);
            setSelection({ range, to: Date.now() });
          }
        }}
      >
        <PageHeader
          titleId="analytics-title"
          title={t('admin.analytics.title')}
          description={data ? `${data.configuration.name} · ${data.configuration.pathname}` : mode}
          leading={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="cursor-pointer"
              aria-label={t('shared.previousPage')}
              onClick={goBack}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
          }
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <TabsList aria-label={t('admin.dashboard.timeRange')}>
              {ANALYTICS_DETAIL_RANGES.map((range) => (
                <TabsTrigger key={range} value={range}>
                  {t(`admin.analytics.ranges.${range}`)}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="cursor-pointer"
              aria-label={t('shared.refresh')}
              aria-busy={loading}
              disabled={loading}
              onClick={() => {
                setRetainRecent(true);
                setSelection({ ...selection, to: Date.now() });
              }}
            >
              <RefreshCw
                aria-hidden="true"
                className={loading ? 'animate-spin motion-reduce:animate-none' : undefined}
              />
            </Button>
          </div>
        </PageHeader>
        <TabsContent value={selection.range} className="flex flex-col gap-5" aria-busy={detail.loading}>
          <QueryFeedback query={{ ...detail, stale: false }} title={t('admin.analytics.loadError')} />
          {detail.loading && !data && <AnalyticsSkeleton />}
          {data && (
            <>
              <AnalyticsMetrics data={data} />
              <AnalyticsTrend data={data} routeType={routeType} />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <AnalyticsDurations data={data} />
                <AnalyticsStatuses data={data} />
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <AnalyticsEntries data={data} />
                <AnalyticsIps data={data} />
              </div>
              <AnalyticsRecent
                routeType={routeType}
                query={retainRecent && recent.loading ? { ...recent, stale: false } : recent}
                limit={limit}
                onLimitChange={(value) => {
                  setRetainRecent(false);
                  setLimit(value);
                }}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
