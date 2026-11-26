import { config, getConfigGroupTags } from './config';
import { nodes } from './node';
import { prepareTemplate, template } from './template';
import type { CompiledNode, CompileParams, CompileResult, Source } from '../../types';

function renderNodes(nodes: readonly CompiledNode[]): string {
  if (!nodes.length) {
    return '';
  }

  const collections: Record<string, Source[]> = {};

  for (const node of nodes) {
    (collections[node.collection ?? 'outbounds'] ??= []).push(node.value);
  }

  return JSON.stringify(collections);
}

export function assemble(input: CompileParams = {}): CompileResult {
  const { document, nodeTags, groupTags } = prepareTemplate(input.template);
  const compiledNodes = nodes.compileNodes(input.nodes, input.options, {
    nodeTags,
    groupTags: [...groupTags, ...getConfigGroupTags(input.config)],
  });
  const compiledConfig = input.config?.length ? config.compileConfig(input.config, compiledNodes) : undefined;
  const content =
    document !== undefined || compiledConfig
      ? template.compileTemplate(document ?? '{}', compiledNodes, compiledConfig)
      : renderNodes(compiledNodes);

  return { target: nodes.type, nodes: compiledNodes, content };
}
