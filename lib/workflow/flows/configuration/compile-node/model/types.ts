import type { CompileParams, SubscriptionType } from '@/lib/subscription/compile';
import type { ConfigDeclaration, ProxyNode, SubscriptionLink, TemplateDocument } from '@/lib/subscription/types';

export type CompileNodeConfig = { target: SubscriptionType | '' };
export type CompileNodeValue = ProxyNode[] | ConfigDeclaration[] | SubscriptionLink[] | TemplateDocument;
export type CompileNodeData = Required<Pick<CompileParams, 'nodes' | 'config' | 'links'>> & {
  template?: TemplateDocument;
};
