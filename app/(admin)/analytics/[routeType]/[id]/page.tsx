import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AnalyticsDetail } from '@/components/app/analytics/detail';
import { AnalyticsSkeleton } from '@/components/app/analytics/skeleton';
import { ANALYTICS_ROUTE_TYPES } from '@/lib/constants/analytics';

async function AnalyticsPage({ params }: Pick<PageProps<'/analytics/[routeType]/[id]'>, 'params'>) {
  const { routeType, id } = await params;
  const type = ANALYTICS_ROUTE_TYPES.find((value) => value === routeType);

  if (!type) {
    notFound();
  }

  return <AnalyticsDetail key={`${type}/${id}`} routeType={type} id={id} />;
}

export default function Page({ params }: PageProps<'/analytics/[routeType]/[id]'>) {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsPage params={params} />
    </Suspense>
  );
}
