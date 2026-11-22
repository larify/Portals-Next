import { appError } from '@/lib/api';
import { isRecord, nonempty } from '@/lib/shared/data';
import { validUrl } from '@/lib/shared/validation';
import { linkType } from '@/lib/subscription/link';
import type { Parser } from '@/lib/types/workflow';
import { arrayOf } from '@/lib/workflow/node/core/schemas';
import type { ConfigIssue, NodeConfigValidationContext } from '@/lib/workflow/node/types';
import type { LinkConfig, LinksConfig } from './types';
import { messages } from '../i18n';

function isParameter(value: unknown): value is LinkConfig['parameters'][number] {
  return (
    isRecord(value) &&
    Object.keys(value).length === 3 &&
    typeof value.id === 'string' &&
    typeof value.key === 'string' &&
    typeof value.value === 'string'
  );
}

export function isLinkConfig(value: unknown): value is LinkConfig {
  return (
    isRecord(value) &&
    Object.keys(value).length === 4 &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    typeof value.icon === 'string' &&
    Array.isArray(value.parameters) &&
    value.parameters.every(isParameter)
  );
}

export function isConfig(value: unknown): value is LinksConfig {
  if (!isRecord(value) || Object.keys(value).length !== 1 || !Array.isArray(value.links)) {
    return false;
  }

  const ids = new Set<string>();

  return value.links.every((entry: unknown) => {
    if (!isRecord(entry)) {
      return false;
    }

    const { id, ...link } = entry;

    if (!nonempty(id) || ids.has(id) || !isLinkConfig(link)) {
      return false;
    }

    ids.add(id);

    return true;
  });
}

function validateParameters(value: LinkConfig, context?: NodeConfigValidationContext): ConfigIssue[] {
  const labels = messages[context?.locale ?? 'en'];
  const issues: ConfigIssue[] = [];
  const keys = new Set<string>();

  value.parameters.forEach((parameter, index) => {
    const key = parameter.key.trim();

    if (!key || keys.has(key)) {
      issues.push({
        path: ['parameters', index, 'key'],
        message: key ? labels.duplicateKey : labels.requiredKey,
      });
    }

    keys.add(key);
  });

  return issues;
}

export function validateLink(value: LinkConfig, context?: NodeConfigValidationContext): ConfigIssue[] {
  const labels = messages[context?.locale ?? 'en'];
  const issues = validateParameters(value, context);
  const url = value.url.trim();

  if (!value.name.trim()) {
    issues.push({ path: ['name'], message: labels.requiredName });
  }

  if (!/^https?:\/\/[^/]/i.test(url) || /[\s\\\x00-\x1f\x7f]|%(?![\da-f]{2})/i.test(url) || !validUrl(url)) {
    issues.push({ path: ['url'], message: labels.invalidUrl });
  }

  return issues;
}

export function validateConfig(value: LinksConfig, context?: NodeConfigValidationContext): ConfigIssue[] {
  return value.links.flatMap((link, index) =>
    validateLink(link, context).map((issue) => ({ ...issue, path: ['links', index, ...issue.path] })),
  );
}

export const configSchema: Parser<LinksConfig> = {
  parse(value) {
    if (!isConfig(value) || value.links.some((link) => validateParameters(link).length > 0)) {
      throw appError('common.INVALID_PARAMS');
    }

    return value;
  },
};

export const outputSchema = arrayOf(linkType);
