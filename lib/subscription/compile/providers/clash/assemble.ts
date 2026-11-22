import { stringify } from 'yaml';
import { config } from './config';
import { nodes } from './node';
import { appendRemote } from './remote';
import { template } from './template';
import type { CompiledNode, CompileParams, CompileResult } from '../../types';

function renderNodes(nodes: readonly CompiledNode[]): string {
  return nodes.length ? stringify({ proxies: nodes.map((node) => node.value) }).trimEnd() : '';
}

export function assemble(input: CompileParams = {}): CompileResult {
  const compiledNodes = nodes.compileNodes(input.nodes, input.options);
  const links = input.links ?? [];
  const compiledConfig =
    input.config?.length || links.length ? config.compileConfig(input.config, compiledNodes) : undefined;

  if (compiledConfig) {
    appendRemote(links, compiledConfig);
  }

  const content =
    input.template !== undefined || compiledConfig
      ? template.compileTemplate(input.template ?? '{}', compiledNodes, compiledConfig)
      : renderNodes(compiledNodes);

  return { target: nodes.type, nodes: compiledNodes, content };
}
