import { config } from './config';
import { nodes } from './node';
import { appendRemote } from './remote';
import { template } from './template';
import type { CompiledNode, CompileParams, CompileResult } from '../../types';

function renderNodes(nodes: readonly CompiledNode[]): string {
  if (!nodes.length) {
    return '';
  }

  const content = nodes.map((node) => node.content).join('\n');
  const sections = nodes
    .flatMap((node) => node.sections)
    .map((section) => {
      const entries = Object.entries(section.entries).map(([key, value]) => `${key} = ${String(value)}`);

      return [`[${section.name}]`, ...entries].join('\n');
    });

  return [`[Proxy]\n${content}`, ...sections].join('\n\n');
}

export function assemble(input: CompileParams = {}): CompileResult {
  const compiledNodes = nodes.compileNodes(input.nodes, input.options);
  const links = input.links ?? [];
  const compiledConfig =
    input.config?.length || links.length
      ? config.compileConfig(
          input.config,
          compiledNodes,
          links.map((link) => link.name),
        )
      : undefined;

  if (compiledConfig) {
    appendRemote(links, compiledConfig);
  }

  const content =
    input.template !== undefined || compiledConfig
      ? template.compileTemplate(input.template ?? '', compiledNodes, compiledConfig)
      : renderNodes(compiledNodes);

  return { target: nodes.type, nodes: compiledNodes, content };
}
