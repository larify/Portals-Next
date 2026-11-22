'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NodeFormProps } from '@/lib/workflow/node/types';
import { IconPicker } from './icon-picker';
import type { LinkConfig } from '../model/types';

export function LinkFields({ value, onChange, disabled, issues }: NodeFormProps<LinkConfig>) {
  const t = useTranslations('workflowNodes.proxy.links');
  const id = useId();

  function updateParameter(index: number, patch: { key: string } | { value: string }) {
    onChange({
      ...value,
      parameters: value.parameters.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    });
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <FieldGroup className="gap-1">
        {(['name', 'url'] as const).map((field) => {
          const issue = issues.find(({ path }) => path[0] === field);

          return (
            <Field key={field} orientation="horizontal" className="min-w-0 gap-2" data-invalid={!!issue}>
              <FieldContent>
                <FieldLabel htmlFor={`${id}-${field}`}>{t(field === 'name' ? 'linkName' : 'url')}</FieldLabel>
              </FieldContent>
              <div data-slot="field-control">
                <div className="grid w-full min-w-0 gap-1">
                  <Input
                    id={`${id}-${field}`}
                    type={field === 'url' ? 'url' : 'text'}
                    required
                    aria-invalid={!!issue}
                    aria-describedby={issue ? `${id}-${field}-error` : undefined}
                    value={value[field]}
                    onChange={(event) => onChange({ ...value, [field]: event.target.value })}
                  />
                  {issue && <FieldError id={`${id}-${field}-error`}>{issue.message}</FieldError>}
                </div>
              </div>
            </Field>
          );
        })}
        <Field orientation="horizontal" className="min-w-0 gap-2">
          <FieldContent>
            <FieldLabel htmlFor={`${id}-icon`}>{t('icon')}</FieldLabel>
          </FieldContent>
          <div data-slot="field-control">
            <IconPicker
              id={`${id}-icon`}
              value={value.icon}
              disabled={disabled}
              onChange={(icon) => onChange({ ...value, icon })}
            />
          </div>
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel id={`${id}-parameters`}>{t('parameters')}</FieldLabel>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={t('addParameter')}
                    onClick={() =>
                      onChange({
                        ...value,
                        parameters: [...value.parameters, { id: crypto.randomUUID(), key: '', value: '' }],
                      })
                    }
                  />
                }
              >
                <Plus />
              </TooltipTrigger>
              <TooltipContent side="top">{t('addParameter')}</TooltipContent>
            </Tooltip>
          </div>
          {value.parameters.length > 0 && (
            <div role="group" aria-labelledby={`${id}-parameters`} className="min-w-0 space-y-3">
              {value.parameters.map((parameter, index) => {
                const issue = issues.find(({ path }) => path[0] === 'parameters' && path[1] === index);
                const errorId = `${id}-parameter-${parameter.id}-error`;

                return (
                  <div
                    key={parameter.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                  >
                    <div className="grid gap-1">
                      <Input
                        aria-label={t('parameterKey')}
                        placeholder={t('parameterKey')}
                        aria-invalid={!!issue}
                        aria-describedby={issue ? errorId : undefined}
                        value={parameter.key}
                        onChange={(event) => updateParameter(index, { key: event.target.value })}
                      />
                      {issue && <FieldError id={errorId}>{issue.message}</FieldError>}
                    </div>
                    <Input
                      aria-label={t('parameterValue')}
                      placeholder={t('parameterValue')}
                      value={parameter.value}
                      onChange={(event) => updateParameter(index, { value: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      aria-label={t('removeParameter')}
                      onClick={() =>
                        onChange({ ...value, parameters: value.parameters.filter((_, rowIndex) => rowIndex !== index) })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Field>
      </FieldGroup>
    </fieldset>
  );
}
