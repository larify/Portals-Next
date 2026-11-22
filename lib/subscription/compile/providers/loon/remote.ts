import { appendSection, quote } from '../../shared/config';
import {
  defineRemote,
  remoteBoolean,
  remoteChoice,
  remoteName,
  remoteParameters,
  remoteUrl,
  remoteValue,
} from '../../shared/remote';

const override = remoteChoice('true', 'false', 'default');
const SUPPORTED_FIELDS = {
  'parser-enabled': remoteBoolean,
  udp: override,
  'block-quic': override,
  'fast-open': override,
  'skip-cert-verify': override,
  'vmess-aead': remoteBoolean,
  'flexible-sni': remoteBoolean,
  enabled: remoteBoolean,
  'img-url': remoteValue,
  'parser-plugin': remoteValue,
  argument: quote,
  'server-dns': remoteValue,
};

export const appendRemote = defineRemote(({ name, url, icon, parameters }, output) => {
  const parserEnabled = parameters['parser-enabled'] ?? parameters['parser-enable'];
  const argument = parameters.argument ?? parameters.arguments;
  const fields = {
    ...parameters,
    ...(parserEnabled !== undefined ? { 'parser-enabled': parserEnabled } : {}),
    ...(argument !== undefined ? { argument } : {}),
    ...(icon ? { 'img-url': icon } : {}),
  };
  const values = [remoteUrl(url), ...remoteParameters(fields, SUPPORTED_FIELDS)];

  appendSection(output, 'Remote Proxy', `${remoteName(name)} = ${values.join(', ')}`);
});
