import { isIP } from 'node:net';
import 'server-only';
import { appError } from '@/lib/api';
import {
  ANALYTICS_BUCKET_MS,
  ANALYTICS_DISTRIBUTION_LIMIT,
  ANALYTICS_DURATION_BOUNDS,
} from '@/lib/constants/analytics';
import repository from '@/lib/repositories/analytics';
import type {
  AnalyticsCount,
  AnalyticsDetail,
  AnalyticsDetailParams,
  AnalyticsDetailPoint,
  AnalyticsDistribution,
  AnalyticsIpCount,
  AnalyticsVisit,
} from '@/lib/types/analytics';
import * as v from './validation';

type Counts = Map<string | null, number>;

function configuration({ routeType, id }: AnalyticsDetailParams) {
  const config = repository.configuration(routeType, id);

  if (!config) {
    throw appError('common.NOT_FOUND');
  }

  return config;
}

function entry(url: string) {
  const parsed = URL.parse(url);

  if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) {
    return { address: null, host: null, path: null };
  }

  return { address: parsed.origin + parsed.pathname, host: parsed.host, path: parsed.pathname };
}

function increment(values: Counts, label: string | null) {
  values.set(label, (values.get(label) ?? 0) + 1);
}

function counts(values: Counts): AnalyticsCount[] {
  return Array.from(values, ([label, count]) => ({ label, count })).sort(
    (left, right) => right.count - left.count || (left.label ?? '').localeCompare(right.label ?? ''),
  );
}

function distribution(values: Counts): AnalyticsDistribution {
  const known = counts(values).filter(({ label }) => label !== null);
  const items = known.slice(0, ANALYTICS_DISTRIBUTION_LIMIT);
  const unknown = values.get(null);

  if (unknown) {
    items.push({ label: null, count: unknown });
  }

  return {
    items,
    other: known.slice(ANALYTICS_DISTRIBUTION_LIMIT).reduce((sum, item) => sum + item.count, 0),
    unique: known.length,
  };
}

function bucketFor(granularity: AnalyticsDetailParams['granularity'], timeZone: string) {
  if (granularity === 'hour') {
    const minuteMs = 60_000;
    const minute = new Intl.DateTimeFormat('en', { minute: 'numeric', timeZone });

    return (time: number) => (Math.floor(time / minuteMs) - Number(minute.format(time))) * minuteMs;
  }

  const date = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });

  return (time: number) => {
    const parts = date.formatToParts(time);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);

    return Date.UTC(year, month - 1, day);
  };
}

export function detail(input: unknown): AnalyticsDetail {
  const params = v.detail(input);
  const config = configuration(params);
  const rows = repository.distribution({
    routeType: params.routeType,
    pathname: config.pathname,
    from: params.from,
    to: params.to,
  });
  const byTime = new Map<number, AnalyticsDetailPoint>();
  const byIp = new Map<string, AnalyticsIpCount>();
  const entries = { address: new Map() as Counts, host: new Map() as Counts, path: new Map() as Counts };
  const statuses: Counts = new Map();
  const errors: Counts = new Map();
  const durations = ANALYTICS_DURATION_BOUNDS.map(() => 0).concat(0);
  const timings: number[] = [];
  const bucket = bucketFor(params.granularity, params.timeZone);
  const ipVersions = { ipv4: 0, ipv6: 0, unknown: 0 };
  let successes = 0;
  let totalDuration = 0;

  for (const row of rows) {
    const visitAt = row.visitAt.getTime();
    const date = bucket(visitAt);
    const point = byTime.get(date) ?? { date, requests: 0, failures: 0 };
    const statusCode = row.statusCode ?? 0;
    const failed = statusCode >= 400 || row.errorCode !== null;
    const url = entry(row.url);
    const ip = row.ip;
    const version = ip ? isIP(ip) : 0;
    const band = ANALYTICS_DURATION_BOUNDS.findIndex((upper) => row.duration < upper);

    point.requests += 1;
    point.failures += Number(failed);
    byTime.set(date, point);
    successes += Number(statusCode >= 200 && !failed);
    totalDuration += row.duration;
    timings.push(row.duration);
    durations[band === -1 ? ANALYTICS_DURATION_BOUNDS.length : band] += 1;
    increment(entries.address, url.address);
    increment(entries.host, url.host);
    increment(entries.path, url.path);
    increment(statuses, row.statusCode === null ? null : String(row.statusCode));

    if (row.errorCode !== null) {
      increment(errors, String(row.errorCode));
    }

    if (ip && version) {
      const item = byIp.get(ip) ?? { label: ip, count: 0, lastVisit: visitAt };

      item.count += 1;
      item.lastVisit = Math.max(item.lastVisit, visitAt);
      byIp.set(ip, item);
      ipVersions[version === 4 ? 'ipv4' : 'ipv6'] += 1;
    } else {
      ipVersions.unknown += 1;
    }
  }

  const start = bucket(params.from.getTime());
  const end = bucket(params.to.getTime() - 1);
  const step = ANALYTICS_BUCKET_MS[params.granularity];

  for (let date = start; date <= end; date += step) {
    if (!byTime.has(date)) {
      byTime.set(date, { date, requests: 0, failures: 0 });
    }
  }

  const ips = [...byIp.values()].sort((left, right) => right.count - left.count || right.lastVisit - left.lastVisit);
  const requests = rows.length;

  timings.sort((left, right) => left - right);

  return {
    configuration: config,
    granularity: params.granularity,
    timeZone: params.timeZone,
    requests,
    uniqueIps: byIp.size,
    successes,
    average: requests ? totalDuration / requests : null,
    p50: timings[Math.ceil(requests * 0.5) - 1] ?? null,
    p95: timings[Math.ceil(requests * 0.95) - 1] ?? null,
    durations,
    series: [...byTime.values()].sort((left, right) => left.date - right.date),
    statuses: counts(statuses),
    errors: counts(errors),
    entries: {
      address: distribution(entries.address),
      host: distribution(entries.host),
      path: distribution(entries.path),
    },
    ips: {
      ...ipVersions,
      items: ips.slice(0, ANALYTICS_DISTRIBUTION_LIMIT),
      other: ips.slice(ANALYTICS_DISTRIBUTION_LIMIT).reduce((sum, item) => sum + item.count, 0),
    },
  };
}

export function visits(input: unknown): AnalyticsVisit[] {
  const params = v.visits(input);
  const config = configuration(params);

  return repository
    .recent({ routeType: params.routeType, pathname: config.pathname, from: params.from, to: params.to }, params.limit)
    .map(({ url, visitAt, ...visit }) => ({ ...visit, entry: entry(url).address, visitAt: visitAt.getTime() }));
}

const service = { detail, visits };

export default service;
