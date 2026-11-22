import type { SubscriptionLink } from '@/lib/subscription/types';
import { defineNode } from '@/lib/workflow/node/core/registry';
import { defaultConfig, definition } from './model/definition';
import { configSchema, outputSchema } from './model/schema';
import type { LinksConfig } from './model/types';
import { execute } from './runtime/executor';

export const linksNode = defineNode<never, LinksConfig, SubscriptionLink[], null>({
  ...definition,
  input: null,
  output: { schema: outputSchema, multiple: true },
  defaultConfig,
  configSchema,
  parseConfig: configSchema.parse,
  parseInput: () => null,
  execute,
});
