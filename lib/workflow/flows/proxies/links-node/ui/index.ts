import { Link } from 'lucide-react';
import { defineNodeView } from '@/lib/workflow/node/core/views';
import { useNodeConfig } from './config';
import { definition } from '../model/definition';
import { validateConfig } from '../model/schema';
import type { LinksConfig } from '../model/types';

export const linksNodeView = defineNodeView<LinksConfig>({
  type: definition.type,
  icon: Link,
  config: { useNodeConfig, validate: validateConfig },
});
