import type {
  ANALYTICS_DETAIL_RANGES,
  ANALYTICS_GRANULARITIES,
  ANALYTICS_LIMITS,
  ANALYTICS_RECENT_LIMITS,
} from '@/lib/constants/analytics';
import type { RouteType } from '@/lib/constants/routes';

export type AnalyticsGranularity = (typeof ANALYTICS_GRANULARITIES)[number];
export type AnalyticsLimit = (typeof ANALYTICS_LIMITS)[number];

export interface AnalyticsRange {
  from: Date;
  to: Date;
}

export interface AnalyticsTotalsParams extends AnalyticsRange {
  granularity: AnalyticsGranularity;
}

export interface AnalyticsRankingParams extends AnalyticsRange {
  routeType?: RouteType;
  limit: AnalyticsLimit;
}

export interface AnalyticsEvent {
  id?: string;
  requestId: string;
  visitAt: Date;
  routeType: RouteType;
  url: string;
  pathname: string;
  ua?: string | null;
  ip?: string | null;
  duration: number;
  statusCode?: number | null;
  errorCode?: number | null;
}

export type AnalyticsSeriesPoint = { date: string } & Record<RouteType, number>;

export interface AnalyticsTotal {
  routeType: RouteType;
  totalRequests: number;
}

export interface AnalyticsTotals {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
  totals: AnalyticsTotal[];
  totalRequests: number;
  series: AnalyticsSeriesPoint[];
}

export interface AnalyticsRankingItem {
  routeType: RouteType;
  routeId: string | null;
  url: string;
  count: number;
}

export interface AnalyticsRanking {
  from: string;
  to: string;
  ranking: AnalyticsRankingItem[];
}

export type AnalyticsDetailRange = (typeof ANALYTICS_DETAIL_RANGES)[number];
export type AnalyticsRecentLimit = (typeof ANALYTICS_RECENT_LIMITS)[number];

export interface AnalyticsDetailRequest {
  routeType: RouteType;
  id: string;
  range: AnalyticsDetailRange;
  to: number;
}

export interface AnalyticsDetailParams extends AnalyticsRange {
  routeType: RouteType;
  id: string;
  granularity: AnalyticsGranularity;
}

export interface AnalyticsCount {
  label: string | null;
  count: number;
}

export interface AnalyticsDistribution {
  items: AnalyticsCount[];
  other: number;
  unique: number;
}

export interface AnalyticsIpCount extends AnalyticsCount {
  lastVisit: number;
}

export interface AnalyticsDetailPoint {
  date: number;
  requests: number;
  failures: number;
}

export interface AnalyticsDetail {
  configuration: { name: string; pathname: string };
  granularity: AnalyticsGranularity;
  timeZone: string;
  requests: number;
  uniqueIps: number;
  successes: number;
  average: number | null;
  p50: number | null;
  p95: number | null;
  durations: number[];
  series: AnalyticsDetailPoint[];
  statuses: AnalyticsCount[];
  errors: AnalyticsCount[];
  entries: { address: AnalyticsDistribution; host: AnalyticsDistribution; path: AnalyticsDistribution };
  ips: { items: AnalyticsIpCount[]; other: number; unknown: number; ipv4: number; ipv6: number };
}

export interface AnalyticsVisit {
  id: string;
  visitAt: number;
  entry: string | null;
  ip: string | null;
  statusCode: number | null;
  errorCode: number | null;
  duration: number;
  os: string | null;
  browser: string | null;
  device: string | null;
}
