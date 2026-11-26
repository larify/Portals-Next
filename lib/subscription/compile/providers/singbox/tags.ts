import type { Source } from '../../types';

export function outboundTag(entry: Source): string | undefined {
  return typeof entry.tag === 'string' && entry.tag.length > 0 ? entry.tag : undefined;
}

export function assignNodeTags(
  tags: readonly (string | undefined)[],
  groupTags: readonly string[],
): (string | undefined)[] {
  const reserved = new Set([...groupTags, ...tags]);
  const indexes = new Map(groupTags.map((tag) => [tag, 0]));

  return tags.map((tag) => {
    if (tag === undefined) {
      return tag;
    }

    let index = indexes.get(tag);

    if (index === undefined) {
      indexes.set(tag, 0);

      return tag;
    }

    let name: string;

    do {
      index += 1;
      name = `${tag} ${index}`;
    } while (reserved.has(name));

    reserved.add(name);
    indexes.set(tag, index);

    return name;
  });
}
