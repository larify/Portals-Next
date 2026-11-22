import { nodeLabel } from '@/lib/workflow/node/utils';
import type { LinkConfig, LinksConfig } from './types';

export const definition = {
  type: 'proxy.links',
  ...nodeLabel('workflowNodes.proxy.links.name'),
  version: 1,
};

export const DEFAULT_LINK: LinkConfig = { name: '', url: '', icon: '', parameters: [] };
export const defaultConfig: LinksConfig = { links: [] };
