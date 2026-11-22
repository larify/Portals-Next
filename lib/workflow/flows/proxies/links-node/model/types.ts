import type { SubscriptionLink } from '@/lib/subscription/types';

export interface LinkConfig extends Omit<SubscriptionLink, 'parameters'> {
  parameters: { id: string; key: string; value: string }[];
}

export interface LinksConfig {
  links: (LinkConfig & { id: string })[];
}
