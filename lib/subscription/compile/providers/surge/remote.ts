import { text } from '../../shared/config';
import { commaDelimitedValue } from '../../shared/ini';
import { policyPathRemote } from '../shared';

export const appendRemote = policyPathRemote(
  {
    'policy-regex-filter': commaDelimitedValue,
    'icon-url': commaDelimitedValue,
    category: commaDelimitedValue,
    'underlying-proxy': commaDelimitedValue,
    'external-policy-modifier': (value) => JSON.stringify(text(value)),
    'external-policy-name-prefix': (value) => {
      if (value.includes('=')) {
        throw new Error('external-policy-name-prefix cannot contain "="');
      }

      return commaDelimitedValue(value);
    },
  },
  'icon-url',
);
