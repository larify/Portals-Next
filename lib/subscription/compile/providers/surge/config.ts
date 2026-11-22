import { CONFIG_TYPES } from '../../../shared';
import { appendSection, atom, defineConfig, parameter, proxyGroup, rule, text } from '../../shared/config';
import { commaDelimitedValue, ruleValue } from '../../shared/ini';
import { BUILTIN_REFERENCES, policyGroupFilter } from '../shared';

const AUTOMATIC_GROUPS = new Set(['url-test', 'fallback', 'load-balance', 'smart']);
const QUOTED_GROUP_FIELDS = new Set(['external-policy-modifier', 'policy-priority']);

export const config = defineConfig(
  'surge',
  (declaration, output) => {
    if (declaration.type === CONFIG_TYPES.PROXY_GROUP) {
      const entry = declaration.value;
      const group = AUTOMATIC_GROUPS.has(entry.kind)
        ? {
            ...entry,
            parameters: entry.parameters.filter((parameter) => parameter.type !== 'named' || parameter.name !== 'url'),
          }
        : entry;

      appendSection(
        output,
        'Proxy Group',
        proxyGroup(group, {
          encode: atom,
          formatParameter: (value) =>
            value.type === 'named'
              ? `${atom(value.name)}=${QUOTED_GROUP_FIELDS.has(value.name) ? JSON.stringify(text(value.value)) : commaDelimitedValue(value.value)}`
              : parameter(value, atom),
        }),
      );
    } else if (declaration.type === CONFIG_TYPES.RULESET) {
      appendSection(
        output,
        'Rule',
        rule(declaration.value, {
          encode: commaDelimitedValue,
          encodeMatch: ['AND', 'OR', 'NOT'].includes(declaration.value.kind) ? ruleValue : commaDelimitedValue,
          match: !['FINAL', 'MATCH'].includes(declaration.value.kind),
        }),
      );
    } else {
      throw new Error('Custom declarations are not supported');
    }
  },
  {
    references: () => BUILTIN_REFERENCES,
    expandGroup: (entry) => !['ssid', 'subnet'].includes(entry.kind),
    filterGroup: policyGroupFilter,
  },
);
