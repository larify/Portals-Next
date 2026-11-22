import type { BaseProxyGroup, ConfigParameter } from '../../types';

export type NativeGroupFilter = (entry: BaseProxyGroup, patterns: readonly string[]) => BaseProxyGroup | undefined;

export function combineGroupPatterns(patterns: readonly string[]): string {
  return patterns.length === 1 ? patterns[0] : patterns.map((pattern) => `(?:${pattern})`).join('|');
}

export function createGroupResolver(
  names: readonly string[],
  referenceNames: readonly string[],
  memberParameters: readonly string[] = [],
): (entry: BaseProxyGroup, filter?: NativeGroupFilter) => BaseProxyGroup {
  const references = new Set(referenceNames);
  const nodeNames = new Set(names);
  const patterns = new Map<string, RegExp>();

  function expand(member: string): string[] {
    if (references.has(member)) {
      return [member];
    }

    let pattern = patterns.get(member);

    if (!pattern) {
      try {
        pattern = new RegExp(member);
      } catch {
        throw new Error(`Invalid proxy group member regex: ${member}`);
      }

      patterns.set(member, pattern);
    }

    return names.filter((name) => pattern.test(name));
  }

  return (entry, filter) => {
    if (entry.parameters.some((parameter) => parameter.type === 'named' && memberParameters.includes(parameter.name))) {
      throw new Error('Proxy group members must use positional parameters');
    }

    if (filter) {
      const parameters: ConfigParameter[] = [];
      const filters: string[] = [];

      for (const parameter of entry.parameters) {
        if (parameter.type === 'positional' && !references.has(parameter.value) && !nodeNames.has(parameter.value)) {
          filters.push(parameter.value);
        } else {
          parameters.push(parameter);
        }
      }

      if (filters.length) {
        const result = filter({ ...entry, parameters }, filters);

        if (result) {
          return result;
        }
      } else {
        return entry;
      }
    }

    const parameters = entry.parameters.flatMap((parameter): ConfigParameter[] => {
      if (parameter.type === 'positional') {
        return expand(parameter.value).map((value) => ({ type: 'positional', value }));
      }

      return [parameter];
    });

    return { ...entry, parameters };
  };
}
