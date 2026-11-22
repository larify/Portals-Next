import { appendSection } from '../../shared/config';
import { commaDelimitedValue } from '../../shared/ini';
import {
  defineRemote,
  remoteBoolean,
  remoteChoice,
  remoteInteger,
  remoteParameters,
  remoteUrl,
  remoteValue,
} from '../../shared/remote';

const SUPPORTED_FIELDS = {
  tag: commaDelimitedValue,
  'update-interval': (value: string, key: string) => String(remoteInteger(value, key, true)),
  'opt-parser': remoteBoolean,
  'as-policy': remoteChoice('static', 'available', 'round-robin'),
  'img-url': commaDelimitedValue,
  enabled: remoteBoolean,
  'require-devices': (value: string) => {
    const devices = value.split(',').map((device) => device.trim());

    if (devices.some((device) => !device)) {
      throw new Error('require-devices must be a comma-separated list of device IDs');
    }

    return devices.map(remoteValue).join(', ');
  },
};

export const appendRemote = defineRemote(({ name, url, icon, parameters }, output) => {
  const fields = { ...parameters, tag: name, ...(icon ? { 'img-url': icon } : {}) };
  const values = [remoteUrl(url), ...remoteParameters(fields, SUPPORTED_FIELDS)];

  appendSection(output, 'server_remote', values.join(', '));
});
