import { schema } from './schema';
import { assignNodeTags, outboundTag } from './tags';
import { defineNodes } from '../shared';

type OutboundNames = { nodeTags: readonly (string | undefined)[]; groupTags: readonly string[] };

export const nodes = defineNodes<OutboundNames>({
  type: 'singbox',
  schema,
  prepare: (source) => ({ ...source, name: source.name.replaceAll('=', '-') }),
  prepareValues(entries, names) {
    const tags = entries.map(({ value, definition }) =>
      (definition.collection ?? 'outbounds') === 'outbounds' ? outboundTag(value) : undefined,
    );
    const preceding = names?.nodeTags ?? [];
    const renamed = assignNodeTags([...preceding, ...tags], names?.groupTags ?? []).slice(preceding.length);

    return entries.map((entry, index) => {
      const tag = renamed[index];

      return tag === tags[index] ? entry : { ...entry, value: { ...entry.value, tag } };
    });
  },
  serialize: (value, definition) => ({
    content: JSON.stringify(value),
    sections: [],
    collection: definition.collection ?? 'outbounds',
  }),
});
