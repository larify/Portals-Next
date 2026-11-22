import { appError } from '@/lib/api';
import { isRecord } from '@/lib/shared/data';
import type { NamedType } from '@/lib/types/workflow';
import { recordOf, stringValue } from '@/lib/workflow/node/core/schemas';
import type { SubscriptionLink } from './types';

const parametersSchema = recordOf(stringValue);

export const linkType: NamedType<SubscriptionLink> = {
  descriptor: { kind: 'ref', id: 'Link', version: 1 },
  base: { kind: 'record', values: { kind: 'union', types: [stringValue.descriptor, parametersSchema.descriptor] } },
  parse(value) {
    if (
      !isRecord(value) ||
      Object.keys(value).length !== 4 ||
      typeof value.name !== 'string' ||
      typeof value.url !== 'string' ||
      typeof value.icon !== 'string'
    ) {
      throw appError('common.INVALID_PARAMS');
    }

    return { name: value.name, url: value.url, icon: value.icon, parameters: parametersSchema.parse(value.parameters) };
  },
};
