import { CONFIG_TYPES } from '../../../shared';
import type { BaseCustomConfig } from '../../../types';
import {
  appendSection,
  atom,
  bind,
  defineConfig,
  groupFilter,
  namedOnly,
  options,
  parameter,
  positional,
  proxyGroup,
  rule,
  text,
} from '../../shared/config';
import { commaDelimitedValue, ruleValue } from '../../shared/ini';
import { combineGroupPatterns } from '../../shared/members';
import { remoteValue } from '../../shared/remote';
import type { CompiledConfig } from '../../types';
import { BUILTIN_REFERENCES } from '../shared';

const FILTER_GROUPS = new Set(['static', 'available', 'round-robin', 'dest-hash', 'url-latency-benchmark']);
const TASK_EVENTS = new Set(['event-network', 'event-interaction']);

function resourceParameter([key, value]: [string, unknown]): string {
  if (key === 'require-devices') {
    return `${key}=${(Array.isArray(value) ? value : [value]).map(text).join(',')}`;
  }

  return `${atom(key)}=${commaDelimitedValue(value)}`;
}

function rewriteRemote(entry: BaseCustomConfig, output: CompiledConfig): void {
  const { url, ...fields } = namedOnly(entry);

  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('Remote rewrite url is required');
  }

  const values = [remoteValue(url), ...Object.entries(fields).map(resourceParameter)];

  appendSection(output, 'rewrite_remote', values.join(', '));
}

function taskLocal(entry: BaseCustomConfig, output: CompiledConfig): void {
  const { trigger, url, ...fields } = namedOnly(entry);

  if (typeof trigger !== 'string' || typeof url !== 'string' || !url.trim()) {
    throw new Error('Task trigger and script URL or path are required');
  }

  const parts = text(trigger).trim().split(/\s+/);
  const schedule = parts.join(' ');

  if (!TASK_EVENTS.has(schedule) && ![5, 6].includes(parts.length)) {
    throw new Error('Task trigger must be an event or a five- or six-field cron expression');
  }

  const values = [`${schedule} ${remoteValue(url)}`, ...Object.entries(fields).map(resourceParameter)];

  appendSection(output, 'task_local', values.join(', '));
}

export const config = defineConfig(
  'quanx',
  (declaration, output) => {
    if (declaration.type === CONFIG_TYPES.PROXY_GROUP) {
      appendSection(
        output,
        'policy',
        proxyGroup(declaration.value, {
          encode: atom,
          nameFirst: false,
          formatParameter: (value) =>
            value.type === 'named' ? resourceParameter([value.name, value.value]) : parameter(value, atom),
        }),
      );
    } else if (declaration.type === CONFIG_TYPES.RULESET) {
      const entry = declaration.value;

      if (declaration.value.kind !== 'RULE-SET') {
        appendSection(
          output,
          'filter_local',
          rule(declaration.value, {
            lowercase: true,
            encode: commaDelimitedValue,
            encodeMatch: ['AND', 'OR', 'NOT'].includes(entry.kind) ? ruleValue : commaDelimitedValue,
            match: !['FINAL', 'MATCH'].includes(declaration.value.kind),
          }),
        );

        return;
      }

      const values = positional(entry);
      const fields = options(entry);

      if (entry.name || Object.hasOwn(fields, 'force-policy')) {
        bind(fields, 'force-policy', entry.name);
      }

      if (!entry.name) {
        delete fields['force-policy'];
      }

      appendSection(
        output,
        'filter_remote',
        [...values.map(commaDelimitedValue), ...Object.entries(fields).map(resourceParameter)].join(','),
      );
    } else if (declaration.value.kind === 'REWRITE_REMOTE') {
      rewriteRemote(declaration.value, output);
    } else if (declaration.value.kind === 'TASK_LOCAL') {
      taskLocal(declaration.value, output);
    } else {
      throw new Error(`Unsupported custom mode: ${declaration.value.kind}`);
    }
  },
  {
    references: () => BUILTIN_REFERENCES,
    expandGroup: (entry) => !['ssid', 'subnet'].includes(entry.kind),
    filterGroup: (entry, patterns) =>
      FILTER_GROUPS.has(entry.kind)
        ? groupFilter(entry, 'server-tag-regex', patterns, combineGroupPatterns)
        : undefined,
  },
);
