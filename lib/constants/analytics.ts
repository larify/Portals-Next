import { ROUTE_TYPE } from './routes';

export const ANALYTICS_ROUTE_TYPES = Object.values(ROUTE_TYPE) as [
  (typeof ROUTE_TYPE)[keyof typeof ROUTE_TYPE],
  ...(typeof ROUTE_TYPE)[keyof typeof ROUTE_TYPE][],
];
export const ANALYTICS_GRANULARITIES = ['hour', 'day'] as const;
export const ANALYTICS_LIMITS = [10, 20, 50] as const;
export const ANALYTICS_BUCKET_MS = { hour: 3_600_000, day: 86_400_000 } as const;
export const ANALYTICS_MAX_RANGE_MS = 90 * ANALYTICS_BUCKET_MS.day;
export const ANALYTICS_DETAIL_RANGES = ['24h', '7d', '30d'] as const;
export const ANALYTICS_RECENT_LIMITS = [5, 10, 20, 50, 100] as const;
export const ANALYTICS_DURATION_BOUNDS = [100, 500, 1000, 2000] as const;
export const ANALYTICS_DISTRIBUTION_LIMIT = 10;
