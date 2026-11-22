import { stringify } from 'yaml';
import { mergeConfig } from '../../shared/config';
import { appendCollection, defineTemplate, parseYaml, TemplateError } from '../../shared/template';

export const template = defineTemplate({
  type: 'clash',
  parse(input) {
    const value = parseYaml(input);

    for (const key of ['proxies', 'proxy-groups', 'rules']) {
      appendCollection(value, key, []);
    }

    for (const key of ['proxy-providers', 'rule-providers']) {
      if (value[key] === null) {
        value[key] = {};
      }
    }

    return { target: 'clash', format: 'yaml', value };
  },
  merge: (document, config) =>
    mergeConfig(document, config, {
      appendArrays: ['proxies', 'proxy-groups', 'rules'],
      shallowObjects: ['rule-providers', 'proxy-providers'],
    }),
  render(document, nodes) {
    if (document.format !== 'yaml') {
      throw new TemplateError('clash', 'TEMPLATE_MISMATCH');
    }

    appendCollection(
      document.value,
      'proxies',
      nodes.map((node) => node.value),
    );

    return stringify(document.value, { lineWidth: 0 }).trimEnd();
  },
});
