import { objectValue } from '../../shared/config';
import { defineRemote, remoteInteger } from '../../shared/remote';

const TEXT_FIELDS = ['path', 'proxy', 'age-secret-key', 'filter', 'exclude-filter', 'exclude-type'] as const;
const INTEGER_FIELDS = ['interval', 'size-limit'] as const;

export const appendRemote = defineRemote(({ name, url, parameters }, output) => {
  const fields = objectValue(output.value, 'proxy-providers');
  const provider: Record<string, string | number> = { type: 'http', url, interval: 86400 };

  for (const key of TEXT_FIELDS) {
    if (Object.hasOwn(parameters, key)) {
      provider[key] = parameters[key];
    }
  }

  for (const key of INTEGER_FIELDS) {
    if (Object.hasOwn(parameters, key)) {
      provider[key] = remoteInteger(parameters[key], key);
    }
  }

  Object.defineProperty(fields, name, { value: provider, enumerable: true, configurable: true, writable: true });
});
