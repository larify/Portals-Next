import { appError } from '@/lib/api';
import type { ConfigDeclaration, ProxyNode, SubscriptionLink } from '@/lib/subscription/types';
import { configSchema } from '../model/schema';
import type { CompileNodeData, CompileNodeValue } from '../model/types';

export const parseConfig = (raw: unknown) => configSchema.parse(raw);

export function parseInput(values: readonly CompileNodeValue[]): CompileNodeData {
  const nodes: ProxyNode[] = [];
  const config: ConfigDeclaration[] = [];
  const links: SubscriptionLink[] = [];
  const result: CompileNodeData = { nodes, config, links };

  for (const value of values) {
    if (!Array.isArray(value)) {
      if (result.template) {
        throw appError('workflow.COMPILE_MULTIPLE_TEMPLATES');
      }

      result.template = value;
      continue;
    }

    for (const item of value) {
      if ('protocol' in item) {
        nodes.push(item);
      } else if ('url' in item) {
        links.push(item);
      } else {
        config.push(item);
      }
    }
  }

  return result;
}
