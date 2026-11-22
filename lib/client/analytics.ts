import type {
  AnalyticsDetail,
  AnalyticsDetailRequest,
  AnalyticsRecentLimit,
  AnalyticsVisit,
} from '@/lib/types/analytics';
import { request } from './request';

export function getAnalyticsDetail(params: AnalyticsDetailRequest & { timeZone: string }, signal?: AbortSignal) {
  return request<AnalyticsDetail>('/api/analytics/detail', params, signal);
}

export function getAnalyticsVisits(
  params: AnalyticsDetailRequest & { limit: AnalyticsRecentLimit },
  signal?: AbortSignal,
) {
  return request<AnalyticsVisit[]>('/api/analytics/visits', params, signal);
}
