import type { SubscriptionLink } from '@/lib/subscription/types';
import type { LinksConfig } from '../model/types';

export async function execute(_input: null, config: LinksConfig): Promise<SubscriptionLink[]> {
  return config.links.map(({ name, url, icon, parameters }) => ({
    name: name.trim(),
    url: url.trim(),
    icon: icon.trim(),
    parameters: Object.fromEntries(parameters.map(({ key, value }) => [key.trim(), value])),
  }));
}
