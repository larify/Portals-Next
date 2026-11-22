import { and, asc, count, desc, eq, gte, lt, sql } from 'drizzle-orm';
import 'server-only';
import { ANALYTICS_BUCKET_MS } from '@/lib/constants/analytics';
import { ROUTE_TYPE } from '@/lib/constants/routes';
import type { RouteType } from '@/lib/constants/routes';
import { db } from '@/lib/db';
import { analytics, caches, originals, proxies, redirects, subscriptions } from '@/lib/db/schema';
import type {
  AnalyticsDetailParams,
  AnalyticsRankingItem,
  AnalyticsRankingParams,
  AnalyticsRecentLimit,
  AnalyticsTotalsParams,
} from '@/lib/types/analytics';

export type AnalyticsRow = typeof analytics.$inferSelect;
export type AnalyticsValues = Omit<typeof analytics.$inferInsert, 'createdAt'>;

export function create(values: AnalyticsValues): AnalyticsRow | undefined {
  return db.insert(analytics).values(values).onConflictDoNothing({ target: analytics.id }).returning().get();
}

export function series({ from, to, granularity }: AnalyticsTotalsParams) {
  const bucketMs = ANALYTICS_BUCKET_MS[granularity];
  const bucket = sql<number>`cast(${analytics.visitAt} / ${bucketMs} as integer) * ${bucketMs}`;

  return db
    .select({ bucket, routeType: analytics.routeType, count: count() })
    .from(analytics)
    .where(and(gte(analytics.visitAt, from), lt(analytics.visitAt, to)))
    .groupBy(bucket, analytics.routeType)
    .orderBy(asc(bucket), asc(analytics.routeType))
    .all();
}

export function ranking({ from, to, routeType, limit }: AnalyticsRankingParams): AnalyticsRankingItem[] {
  const url = sql<string>`case when instr(${analytics.url}, '?') > 0 then substr(${analytics.url}, 1, instr(${analytics.url}, '?') - 1) else ${analytics.url} end`;
  const visits = count();

  const ranked = db
    .select({
      routeType: analytics.routeType,
      pathname: sql<
        string | null
      >`case when min(${analytics.pathname}) = max(${analytics.pathname}) then min(${analytics.pathname}) end`.as(
        'analytics_pathname',
      ),
      url: url.as('analytics_url'),
      count: visits.as('analytics_count'),
    })
    .from(analytics)
    .where(
      and(
        gte(analytics.visitAt, from),
        lt(analytics.visitAt, to),
        routeType ? eq(analytics.routeType, routeType) : undefined,
      ),
    )
    .groupBy(analytics.routeType, url)
    .orderBy(desc(visits), asc(url), asc(analytics.routeType))
    .limit(limit)
    .as('ranked');

  return db
    .select({
      routeType: ranked.routeType,
      routeId: sql<
        string | null
      >`coalesce(${proxies.id}, ${redirects.id}, ${caches.id}, ${originals.id}, ${subscriptions.id})`,
      url: ranked.url,
      count: ranked.count,
    })
    .from(ranked)
    .leftJoin(proxies, and(eq(ranked.routeType, ROUTE_TYPE.PROXY), eq(proxies.pathname, ranked.pathname)))
    .leftJoin(redirects, and(eq(ranked.routeType, ROUTE_TYPE.REDIRECT), eq(redirects.pathname, ranked.pathname)))
    .leftJoin(caches, and(eq(ranked.routeType, ROUTE_TYPE.CACHE), eq(caches.pathname, ranked.pathname)))
    .leftJoin(originals, and(eq(ranked.routeType, ROUTE_TYPE.ORIGINAL), eq(originals.pathname, ranked.pathname)))
    .leftJoin(
      subscriptions,
      and(eq(ranked.routeType, ROUTE_TYPE.SUBSCRIPTION), eq(subscriptions.pathname, ranked.pathname)),
    )
    .orderBy(desc(ranked.count), asc(ranked.url), asc(ranked.routeType))
    .all();
}

const CONFIGURATIONS = { proxies, redirects, caches, originals, subscriptions };

export function configuration(routeType: RouteType, id: string) {
  const table = CONFIGURATIONS[routeType];

  return db.select({ name: table.name, pathname: table.pathname }).from(table).where(eq(table.id, id)).get();
}

function visitsQuery({
  routeType,
  from,
  to,
  pathname,
}: Omit<AnalyticsDetailParams, 'id' | 'granularity'> & { pathname: string }) {
  return db
    .select({
      id: analytics.id,
      visitAt: analytics.visitAt,
      url: analytics.url,
      ip: analytics.ip,
      duration: analytics.duration,
      statusCode: analytics.statusCode,
      errorCode: analytics.errorCode,
      os: analytics.os,
      browser: analytics.browser,
      device: analytics.device,
    })
    .from(analytics)
    .where(
      and(
        eq(analytics.routeType, routeType),
        eq(analytics.pathname, pathname),
        gte(analytics.visitAt, from),
        lt(analytics.visitAt, to),
      ),
    );
}

export function distribution(params: Parameters<typeof visitsQuery>[0]) {
  return visitsQuery(params).all();
}

export function recent(params: Parameters<typeof visitsQuery>[0], limit: AnalyticsRecentLimit) {
  return visitsQuery(params)
    .orderBy(desc(analytics.visitAt), desc(analytics.createdAt), desc(analytics.id))
    .limit(limit)
    .all();
}

const repository = { create, series, ranking, configuration, distribution, recent };

export default repository;
