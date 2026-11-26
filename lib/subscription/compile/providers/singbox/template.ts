import { isRecord } from '@/lib/shared/data';
import { assignNodeTags, outboundTag } from './tags';
import { mergeConfig } from '../../shared/config';
import { appendCollection, defineTemplate, parseJson, TemplateError } from '../../shared/template';
import type { TemplateSource } from '../../types';

function getOutboundTags(entries: unknown) {
  const outbounds: readonly unknown[] = Array.isArray(entries) ? entries : [];
  const groupTags: string[] = [];
  const nodeTags = outbounds.map((entry) => {
    if (!isRecord(entry)) {
      return undefined;
    }

    const tag = outboundTag(entry);

    if (entry.type === 'selector' || entry.type === 'urltest' || Array.isArray(entry.outbounds)) {
      if (tag !== undefined) {
        groupTags.push(tag);
      }

      return undefined;
    }

    return tag;
  });

  return { outbounds, nodeTags, groupTags };
}

function withTag<T>(entry: T, tag: string | undefined): T {
  return tag !== undefined && isRecord(entry) && entry.tag !== tag ? { ...entry, tag } : entry;
}

export const template = defineTemplate({
  type: 'singbox',
  parse(input) {
    const value = parseJson(input);

    appendCollection(value, 'outbounds', []);
    appendCollection(value, 'endpoints', []);

    return { target: 'singbox', format: 'json', value };
  },
  merge: (document, config) =>
    mergeConfig(document, config, { appendArrays: ['outbounds', 'endpoints', 'route.rules', 'route.rule_set'] }),
  render(document, nodes) {
    if (document.format !== 'json') {
      throw new TemplateError('singbox', 'TEMPLATE_MISMATCH');
    }

    const { outbounds } = document.value;
    const { outbounds: existing, nodeTags, groupTags } = getOutboundTags(outbounds);
    const outgoing = nodes.filter((node) => (node.collection ?? 'outbounds') === 'outbounds').map((node) => node.value);
    const tags = assignNodeTags([...nodeTags, ...outgoing.map(outboundTag)], groupTags);

    if (Array.isArray(outbounds)) {
      document.value.outbounds = existing.map((entry, index) => withTag(entry, tags[index]));
    }

    appendCollection(
      document.value,
      'outbounds',
      outgoing.map((entry, index) => withTag(entry, tags[existing.length + index])),
    );
    appendCollection(
      document.value,
      'endpoints',
      nodes.filter((node) => node.collection === 'endpoints').map((node) => node.value),
    );

    return JSON.stringify(document.value);
  },
});

export function prepareTemplate(input?: TemplateSource) {
  const document = typeof input === 'string' ? template.parseTemplate(input) : input;
  const { nodeTags, groupTags } = getOutboundTags(document?.format === 'json' ? document.value.outbounds : undefined);

  return { document, nodeTags, groupTags };
}
