import { isRecord } from '@/lib/shared/data';
import type { BaseProxyGroup, ProxyNode } from '../../types';
import { appendSection, groupFilter, options, quote } from '../shared/config';
import { combineGroupPatterns } from '../shared/members';
import {
  defineRemote,
  remoteBoolean,
  remoteInteger,
  remoteName,
  remoteParameters,
  remoteUrl,
  remoteValue,
} from '../shared/remote';
import type { RemoteFields } from '../shared/remote';
import type { CompiledNode, CompileOptions, NodeDefinition, NodeModule, NodeSource, Schema, Source } from '../types';

export const BUILTIN_REFERENCES = [
  'DIRECT',
  'REJECT',
  'REJECT-DROP',
  'REJECT-NO-DROP',
  'REJECT-TINYGIF',
  'REJECT-DICT',
  'REJECT-ARRAY',
  'PASS',
  'COMPATIBLE',
  'GLOBAL',
  'direct',
  'reject',
  'proxy',
] as const;

type NodeModuleDefinition = Pick<NodeModule, 'type' | 'schema' | 'serialize'> & {
  prepare?: (source: NodeSource) => NodeSource;
  validate?: (source: Readonly<NodeSource>) => boolean;
};

function setProperty(target: Source, key: string, value: unknown): void {
  Object.defineProperty(target, key, { value, enumerable: true, configurable: true, writable: true });
}

export function transform<T extends object>(source: T, schema: Schema<T>): Source {
  const result: Source = {};

  for (const [key, rule] of Object.entries(schema)) {
    if (typeof rule === 'string') {
      if (Object.hasOwn(source, rule) && source[rule] !== undefined) {
        setProperty(result, key, source[rule]);
      }

      continue;
    }

    if (rule.kind === 'field') {
      let value: unknown = Object.hasOwn(source, rule.source) ? source[rule.source] : undefined;

      if (value === undefined && Object.hasOwn(rule, 'default')) {
        value = rule.default;
      }

      if (value === undefined || (rule.when && !rule.when(value, source))) {
        continue;
      }

      if (rule.transform) {
        value = rule.transform(value, source);
      }

      if (value !== undefined) {
        setProperty(result, key, value);
      }

      continue;
    }

    if (rule.kind === 'object') {
      if (rule.when && !rule.when(source)) {
        continue;
      }

      const nested = transform(source, rule.fields);

      if (Object.keys(nested).length > 0) {
        setProperty(result, key, nested);
      }

      continue;
    }

    if (!Object.hasOwn(source, rule.source)) {
      continue;
    }

    const value: unknown = source[rule.source];

    if (!Array.isArray(value) || (rule.when && !rule.when(value, source))) {
      continue;
    }

    const items = value
      .map((item: unknown, index) => {
        if (rule.transformItem) {
          return rule.transformItem(item, index, source);
        }

        return rule.items && isRecord(item) ? transform(item, rule.items) : item;
      })
      .filter((item) => item !== undefined);

    setProperty(result, key, items);
  }

  return result;
}

function resolve(
  node: ProxyNode,
  provider: NodeModuleDefinition,
  context: CompileOptions,
): { definition: NodeDefinition; source: NodeSource } | undefined {
  const definition = Object.hasOwn(provider.schema, node.protocol) ? provider.schema[node.protocol] : undefined;
  const index = context.index ?? 0;

  if (!definition || !Number.isInteger(index) || index < 0) {
    return;
  }

  let source: NodeSource = {
    ...node,
    index,
    sectionName: context.sectionName ?? `subscription-${index + 1}`,
    options: context.options,
  };

  source = provider.prepare?.(source) ?? source;

  if ((provider.validate && !provider.validate(source)) || (definition.when && !definition.when(source))) {
    return;
  }

  return { definition, source };
}

function transformNode(
  node: ProxyNode,
  provider: NodeModuleDefinition,
  context: CompileOptions = {},
): { definition: NodeDefinition; source: NodeSource; value: Source } | undefined {
  const resolved = resolve(node, provider, context);

  return resolved ? { ...resolved, value: transform(resolved.source, resolved.definition.schema) } : undefined;
}

export function defineNodes(definition: NodeModuleDefinition): NodeModule {
  return {
    ...definition,
    compileNodes(nodes, options) {
      const compiled: CompiledNode[] = [];

      nodes?.forEach((node, index) => {
        const resolved = transformNode(node, definition, { index, options });

        if (!resolved) {
          return;
        }

        const { value } = resolved;

        const output = definition.serialize(value, resolved.definition);

        if (output) {
          compiled.push({
            target: definition.type,
            value,
            ...output,
          });
        }
      });

      return compiled;
    },
  };
}

export function policyGroupFilter(
  entry: BaseProxyGroup,
  patterns: readonly string[],
  remotes: readonly string[],
): BaseProxyGroup {
  const fields = options(entry);
  const hasSource = ['policy-path', 'include-all-proxies', 'include-other-group'].some((key) =>
    Object.hasOwn(fields, key),
  );
  const defaults = hasSource
    ? {}
    : { 'include-all-proxies': true, ...(remotes.length ? { 'include-other-group': remotes.join(',') } : {}) };

  return groupFilter(entry, 'policy-regex-filter', patterns, combineGroupPatterns, defaults);
}

const POLICY_PATH_FIELDS = {
  'update-interval': (value, key) => String(remoteInteger(value, key)),
  'policy-regex-filter': remoteValue,
  'include-all-proxies': remoteBoolean,
  'include-other-group': quote,
  hidden: remoteBoolean,
} satisfies RemoteFields;

export function policyPathRemote(supported: RemoteFields, iconKey?: string) {
  const fields = { ...POLICY_PATH_FIELDS, ...supported };

  return defineRemote(({ name, url, icon, parameters }, output) => {
    const options = icon && iconKey ? { ...parameters, [iconKey]: icon } : parameters;
    const values = ['select', `policy-path=${remoteUrl(url)}`, ...remoteParameters(options, fields)];

    appendSection(output, 'Proxy Group', `${remoteName(name)} = ${values.join(', ')}`);
  });
}
