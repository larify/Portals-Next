import { ConfigCompileError, quote, text } from './config';
import type { SubscriptionLink } from '../../types';
import type { CompiledConfig } from '../types';

type RemoteEncoder = (value: string, key: string) => string;
export type RemoteFields = Readonly<Record<string, RemoteEncoder>>;

export function defineRemote(convert: (link: SubscriptionLink, output: CompiledConfig) => void) {
  return (links: readonly SubscriptionLink[], output: CompiledConfig): void => {
    for (const [index, link] of links.entries()) {
      try {
        convert(link, output);
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }

        throw new ConfigCompileError(output.target, error.message, index);
      }
    }
  };
}

export function remoteValue(value: string): string {
  const result = text(value);

  return /[,;"\s]/.test(result) ? quote(result) : result;
}

export function remoteUrl(value: string): string {
  return remoteValue(value.replace(/[\x00-\x1f\x7f]/g, encodeURIComponent));
}

export function remoteName(name: string): string {
  const result = text(name);

  return /^(?:#|;|\[)|[=,"]/.test(result) ? quote(result) : result;
}

export function remoteChoice(...choices: string[]): RemoteEncoder {
  return (value, key) => {
    const result = value.trim().toLowerCase();

    if (!choices.includes(result)) {
      throw new Error(`${key} must be one of ${choices.join(', ')}`);
    }

    return result;
  };
}

export const remoteBoolean = remoteChoice('true', 'false');

export function remoteInteger(value: string, key: string, signed = false): number {
  const result = value.trim();
  const number = Number(result);

  if (!/^-?\d+$/.test(result) || !Number.isSafeInteger(number) || (!signed && number < 0)) {
    throw new Error(`${key} must be ${signed ? 'an' : 'a non-negative'} integer`);
  }

  return number;
}

export function remoteParameters(fields: Record<string, string>, supported: RemoteFields): string[] {
  return Object.entries(supported).flatMap(([key, encode]) =>
    Object.hasOwn(fields, key) ? [`${key}=${encode(fields[key], key)}`] : [],
  );
}
