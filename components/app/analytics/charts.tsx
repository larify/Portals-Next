'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { NoData } from '@/components/business/no-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ANALYTICS_DURATION_BOUNDS } from '@/lib/constants/analytics';
import { DASHBOARD_COLORS } from '@/lib/constants/dashboard';
import type { RouteType } from '@/lib/constants/routes';
import type { AnalyticsDetail } from '@/lib/types/analytics';

const METRICS = ['requests', 'failures'] as const;
const STATUS_COLORS = [...Object.values(DASHBOARD_COLORS), 'var(--destructive)', 'var(--primary)'];

export function AnalyticsTrend({ data, routeType }: { data: AnalyticsDetail; routeType: RouteType }) {
  const t = useTranslations();
  const locale = useLocale();
  const [visible, setVisible] = useState({ requests: true, failures: true });
  const hourly = data.granularity === 'hour';
  const timeZone = hourly ? data.timeZone : 'UTC';
  const axis = new Intl.DateTimeFormat(
    locale,
    hourly
      ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }
      : { month: 'short', day: 'numeric', timeZone },
  );
  const tooltip = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(hourly && { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const }),
    timeZone,
  });
  const config = {
    requests: { label: t('admin.analytics.requests'), color: DASHBOARD_COLORS[routeType] },
    failures: { label: t('admin.analytics.failures'), color: 'var(--destructive)' },
  };

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2>{t('admin.analytics.trend')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-62 px-2 sm:px-6">
        {data.requests === 0 ? (
          <NoData />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-62 w-full" aria-label={t('admin.analytics.trend')}>
            <AreaChart accessibilityLayer data={data.series} margin={{ left: 4, right: 12, top: 6 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(date: number) => axis.format(date)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_label, [item]) => {
                      const date: unknown = item?.payload?.date;

                      return typeof date === 'number' && Number.isFinite(date) ? tooltip.format(date) : null;
                    }}
                  />
                }
              />
              <ChartLegend
                content={
                  <div
                    className="flex flex-wrap items-center justify-center gap-2 pt-3"
                    role="group"
                    aria-label={t('admin.analytics.trendLegend')}
                  >
                    {METRICS.map((metric) => (
                      <button
                        key={metric}
                        type="button"
                        aria-pressed={visible[metric]}
                        onClick={() => setVisible((current) => ({ ...current, [metric]: !current[metric] }))}
                        className="focus-visible:ring-ring inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm transition-opacity focus-visible:ring-2 focus-visible:outline-none"
                        style={{ opacity: visible[metric] ? 1 : 0.45 }}
                      >
                        <span
                          aria-hidden="true"
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: config[metric].color }}
                        />
                        {config[metric].label}
                      </button>
                    ))}
                  </div>
                }
              />
              {METRICS.map((metric) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={`var(--color-${metric})`}
                  strokeWidth={1.5}
                  strokeDasharray={metric === 'failures' ? '4 3' : undefined}
                  fill="none"
                  fillOpacity={0}
                  dot={false}
                  hide={!visible[metric]}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsStatuses({ data }: { data: AnalyticsDetail }) {
  const t = useTranslations('admin.analytics');
  const format = useFormatter();
  const formatShare = (share: number) => format.number(share, { style: 'percent', maximumFractionDigits: 1 });
  const statuses = data.statuses.map(({ label, count }, index) => ({
    label: label ?? t('unrecorded'),
    share: count / data.requests,
    fill: label === null ? 'var(--muted-foreground)' : STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2>{t('responses')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-24 flex-1">
        {statuses.length === 0 ? (
          <NoData />
        ) : (
          <>
            <ChartContainer config={{}} className="aspect-auto h-52 w-full" aria-label={t('responses')}>
              <PieChart accessibilityLayer>
                <Pie
                  data={statuses}
                  dataKey="share"
                  nameKey="label"
                  outerRadius="60%"
                  stroke="var(--card)"
                  strokeWidth={2}
                  labelLine
                  label={({ x, y, percent, textAnchor }) => (
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      className="fill-foreground text-xs tabular-nums"
                    >
                      {formatShare(percent ?? 0)}
                    </text>
                  )}
                />
              </PieChart>
            </ChartContainer>
            <ul role="list" className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {statuses.map((status) => (
                <li key={status.label} className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: status.fill }}
                  />
                  {status.label}
                  <span className="text-muted-foreground tabular-nums">{formatShare(status.share)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDurations({ data }: { data: AnalyticsDetail }) {
  const t = useTranslations('admin.analytics');
  const format = useFormatter();
  const values = data.durations.map((count, index) => {
    const lower = ANALYTICS_DURATION_BOUNDS[index - 1] ?? 0;
    const upper = ANALYTICS_DURATION_BOUNDS[index];

    return {
      label:
        upper === undefined ? t('durationAtLeast', { value: lower }) : t('durationRange', { lower, upper: upper - 1 }),
      count,
    };
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2>{t('duration')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-24 flex-1">
        {data.requests === 0 ? (
          <NoData />
        ) : (
          <ChartContainer
            config={{ count: { label: t('requests'), color: 'var(--primary)' } }}
            className="aspect-auto min-h-46 w-full flex-1"
          >
            <BarChart data={values} margin={{ left: 0, right: 8 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
              <YAxis
                allowDecimals={false}
                width={30}
                tickLine={false}
                axisLine={false}
                domain={[0, (max: number) => Math.max(1, max)]}
                tickFormatter={(value: number) => format.number(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={52} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
