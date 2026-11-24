'use client';

import { Copy, ListFilter, ListOrdered, type LucideIcon, Search } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ANALYTICS_LIMITS, ANALYTICS_ROUTE_TYPES } from '@/lib/constants/analytics';
import { ROUTE_ICONS } from '@/lib/constants/routes';
import type { AnalyticsLimit, AnalyticsRanking, AnalyticsRankingItem } from '@/lib/types/analytics';
import type { DashboardCategory, DashboardQuery } from '@/lib/types/dashboard';
import { QueryFeedback } from './query-feedback';

const RANKING_CATEGORIES = ['all', ...ANALYTICS_ROUTE_TYPES] as const;

function RankingMenu<T extends string | number>({
  icon: Icon,
  label,
  value,
  items,
  onValueChange,
}: {
  icon: LucideIcon;
  label: string;
  value: T;
  items: { value: T; label: string }[];
  onValueChange: (value: unknown) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon-sm" aria-label={label} />}>
        <Icon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {items.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value} closeOnClick>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RankingList({ items, search }: { items: AnalyticsRankingItem[]; search: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const term = search.trim().toLowerCase();
  const matches = items
    .map((item, index) => ({ item, rank: index + 1 }))
    .filter(({ item }) => item.url.toLowerCase().includes(term));

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('shared.copySuccess'));
    } catch {
      toast.error(t('shared.copyError'));
    }
  }

  if (!matches.length) {
    return (
      <p role="status" className="text-muted-foreground py-8 text-center text-sm">
        {t(items.length ? 'admin.dashboard.rankingNoMatches' : 'admin.dashboard.noVisits')}
      </p>
    );
  }

  return (
    <ol role="list" className="space-y-4">
      {matches.map(({ item, rank }) => {
        const Icon = ROUTE_ICONS[item.routeType];

        return (
          <li
            key={`${item.routeType}:${item.url}`}
            className="group bg-muted/55 hover:bg-muted grid min-h-17.5 cursor-default grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2.5 rounded-lg p-3 transition-colors @lg/ranking:gap-x-4 @2xl/ranking:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
          >
            <div className="border-border col-start-1 row-span-2 row-start-1 grid size-10 place-items-center rounded-lg border @lg/ranking:size-12">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1.5 self-end">
              {item.routeId ? (
                <Link
                  href={`/analytics/${item.routeType}/${encodeURIComponent(item.routeId)}`}
                  className="focus-visible:ring-ring min-w-0 cursor-pointer truncate rounded-sm font-medium no-underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {item.url}
                </Link>
              ) : (
                <span className="min-w-0 truncate font-medium">{item.url}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="hidden opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 @2xl/ranking:inline-flex [@media(hover:none)]:opacity-100"
                aria-label={t('shared.copyPath')}
                onClick={() => void copy(item.url)}
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
            <p className="text-muted-foreground col-start-2 row-start-2 self-start text-xs tabular-nums">
              {t('admin.dashboard.rankingPosition', { rank: format.number(rank) })}
            </p>
            <Badge variant="outline" className="col-start-3 row-span-2 row-start-1 hidden @2xl/ranking:inline-flex">
              {t(`admin.sidebar.${item.routeType}`)}
            </Badge>
            <div className="col-start-3 row-span-2 row-start-1 min-w-12 text-right @lg/ranking:min-w-20 @2xl/ranking:col-start-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">{t('admin.dashboard.visits')}</div>
              <div className="font-medium tabular-nums">{format.number(item.count)}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Ranking({
  query,
  category,
  onCategoryChange,
  limit,
  onLimitChange,
}: {
  query: DashboardQuery<AnalyticsRanking>;
  category: DashboardCategory;
  onCategoryChange: (value: DashboardCategory) => void;
  limit: AnalyticsLimit;
  onLimitChange: (value: AnalyticsLimit) => void;
}) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const searchLabel = t('admin.dashboard.rankingSearch');
  const categoryLabel = t('admin.dashboard.rankingCategory');
  const limitLabel = t('admin.dashboard.rankingLimit');
  const categories = RANKING_CATEGORIES.map((value) => ({
    value,
    label: value === 'all' ? t('admin.dashboard.all') : t(`admin.sidebar.${value}`),
  }));
  const limits = ANALYTICS_LIMITS.map((value) => ({ value, label: t('admin.dashboard.topN', { count: value }) }));

  function changeCategory(value: unknown) {
    const next = RANKING_CATEGORIES.find((category) => category === value);

    if (next) {
      onCategoryChange(next);
    }
  }

  function changeLimit(value: unknown) {
    const next = ANALYTICS_LIMITS.find((limit) => limit === value);

    if (next) {
      onLimitChange(next);
    }
  }

  return (
    <Card size="sm" className="@container/ranking relative" aria-busy={query.loading}>
      {query.loading && query.data && (
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="bg-primary animate-loading-progress h-full w-[35%] motion-reduce:w-full motion-reduce:animate-none" />
        </div>
      )}
      <Tabs value={category} onValueChange={changeCategory} className="gap-4">
        <CardHeader className="grid-cols-1 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">
              <h2>{t('admin.dashboard.rankingTitle')}</h2>
            </CardTitle>
            <div className="ml-auto flex shrink-0 gap-2 @2xl/ranking:hidden">
              <RankingMenu
                icon={category === 'all' ? ListFilter : ROUTE_ICONS[category]}
                label={categoryLabel}
                value={category}
                items={categories}
                onValueChange={changeCategory}
              />
              <RankingMenu
                icon={ListOrdered}
                label={limitLabel}
                value={limit}
                items={limits}
                onValueChange={changeLimit}
              />
            </div>
            <Select value={limit} items={limits} onValueChange={changeLimit}>
              <SelectTrigger size="sm" aria-label={limitLabel} className="hidden @2xl/ranking:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" alignItemWithTrigger={false} className="min-w-0">
                {limits.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3 @2xl/ranking:flex-row @2xl/ranking:flex-wrap @2xl/ranking:items-center @2xl/ranking:justify-between">
            <InputGroup className="h-8 @2xl/ranking:max-w-sm @2xl/ranking:grow @2xl/ranking:basis-56">
              <InputGroupInput
                type="search"
                aria-label={searchLabel}
                placeholder={searchLabel}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-full"
              />
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            <div className="-my-1 hidden max-w-full min-w-0 overflow-x-auto py-1 @2xl/ranking:block">
              <TabsList aria-label={categoryLabel}>
                {categories.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value={category} className="space-y-4">
            <QueryFeedback query={query} title={t('admin.dashboard.rankingError')} />
            {!query.data && query.loading && (
              <div className="space-y-4" aria-hidden="true">
                {Array.from({ length: limit }, (_, index) => (
                  <Skeleton key={index} className="h-17.5 w-full rounded-lg" />
                ))}
              </div>
            )}
            {query.data && <RankingList items={query.data.ranking} search={search} />}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
