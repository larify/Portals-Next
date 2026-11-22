'use client';

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { ArrowDown, ArrowUp, Copy, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveLocale } from '@/i18n/config';
import { cloneJson } from '@/lib/shared/data';
import type { ConfigIssue, NodeFormProps } from '@/lib/workflow/node/types';
import styles from '@/styles/ui.module.css';
import { LinkFields } from './link-fields';
import { DEFAULT_LINK } from '../model/definition';
import { validateLink } from '../model/schema';
import type { LinkConfig, LinksConfig } from '../model/types';

interface LinkEditor {
  id: string | null;
  draft: LinkConfig;
  issues: readonly ConfigIssue[];
}

function ConfigForm({ value, onChange, disabled, issues }: NodeFormProps<LinksConfig>) {
  const t = useTranslations();
  const locale = resolveLocale(useLocale());
  const listId = useId();
  const [editor, setEditor] = useState<LinkEditor | null>(null);

  function moveLink(index: number, offset: -1 | 1) {
    const links = [...value.links];
    const nextIndex = index + offset;

    [links[index], links[nextIndex]] = [links[nextIndex], links[index]];
    onChange({ links });
  }

  function saveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!editor || disabled) {
      return;
    }

    const linkIssues = validateLink(editor.draft, { locale });

    if (linkIssues.length) {
      setEditor({ ...editor, issues: linkIssues });

      return;
    }

    const link = { ...editor.draft, id: editor.id ?? crypto.randomUUID() };
    const links =
      editor.id === null ? [...value.links, link] : value.links.map((item) => (item.id === link.id ? link : item));

    onChange({ links });
    setEditor(null);
  }

  return (
    <Dialog
      open={editor !== null}
      onOpenChange={(open) => {
        if (!open) {
          setEditor(null);
        }
      }}
    >
      <Field>
        <div className="flex items-center justify-between gap-3">
          <FieldLabel id={listId}>{t('workflowNodes.proxy.links.name')}</FieldLabel>
          <DialogTrigger
            onClick={() => setEditor({ id: null, draft: DEFAULT_LINK, issues: [] })}
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={disabled}
                aria-label={t('shared.new')}
                title={t('shared.new')}
              />
            }
          >
            <Plus />
          </DialogTrigger>
        </div>
        {value.links.length > 0 && (
          <ol aria-labelledby={listId} className="divide-border @container min-w-0 divide-y rounded-md border px-3">
            {value.links.map(({ id, ...link }, index) => (
              <li key={id} className="flex items-center gap-2 py-2">
                <Avatar aria-hidden="true" className="border-input overflow-hidden border after:hidden">
                  <AvatarImage src={link.icon.trim() || undefined} alt="" />
                  <AvatarFallback>
                    <ImageIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{link.name || t('workflowNodes.proxy.links.linkName')}</p>
                  <Tooltip>
                    <TooltipTrigger
                      render={<span className="text-muted-foreground block truncate text-xs" tabIndex={0} />}
                    >
                      {link.url}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="break-all">
                      {link.url}
                    </TooltipContent>
                  </Tooltip>
                  <FieldError errors={issues.filter(({ path }) => path[0] === 'links' && path[1] === index)} />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled || index === 0}
                    aria-label={t('workflowNodes.proxy.links.moveUp')}
                    title={t('workflowNodes.proxy.links.moveUp')}
                    onClick={() => moveLink(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled || index === value.links.length - 1}
                    aria-label={t('workflowNodes.proxy.links.moveDown')}
                    title={t('workflowNodes.proxy.links.moveDown')}
                    onClick={() => moveLink(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <DialogTrigger
                  onClick={() => setEditor({ id, draft: link, issues: [] })}
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={disabled}
                      aria-label={t('shared.edit')}
                      title={t('shared.edit')}
                    />
                  }
                >
                  <Pencil />
                </DialogTrigger>
                <Tooltip>
                  <DialogTrigger
                    onClick={() => setEditor({ id: null, draft: cloneJson(link), issues: [] })}
                    render={
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={disabled}
                            aria-label={t('shared.duplicate')}
                          />
                        }
                      />
                    }
                  >
                    <Copy />
                  </DialogTrigger>
                  <TooltipContent side="top">{t('shared.duplicate')}</TooltipContent>
                </Tooltip>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label={t('shared.delete')}
                  title={t('shared.delete')}
                  onClick={() => onChange({ links: value.links.filter((item) => item.id !== id) })}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </Field>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b p-4 pr-12 sm:px-6 sm:pr-12">
          <DialogTitle>{t(editor?.id ? 'shared.edit' : 'shared.new')}</DialogTitle>
          <DialogDescription>{t('workflowNodes.proxy.links.description')}</DialogDescription>
        </DialogHeader>
        {editor && (
          <form noValidate onSubmit={saveLink} className={`flex min-h-0 flex-1 flex-col ${styles.highlight}`}>
            <ScrollArea className="flex min-h-0 flex-1 flex-col overflow-hidden [&>[data-slot=scroll-area-viewport]]:min-h-0 [&>[data-slot=scroll-area-viewport]]:overscroll-contain">
              <ScrollAreaPrimitive.Content className="p-6">
                <LinkFields
                  value={editor.draft}
                  disabled={disabled}
                  issues={editor.issues}
                  onChange={(draft) => setEditor({ ...editor, draft, issues: [] })}
                />
              </ScrollAreaPrimitive.Content>
            </ScrollArea>
            <DialogFooter className="shrink-0 border-t p-4 sm:px-6">
              <DialogClose render={<Button type="button" variant="outline" />}>{t('shared.cancel')}</DialogClose>
              <Button type="submit" disabled={disabled}>
                {t('shared.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useNodeConfig() {
  const t = useTranslations('workflowNodes.proxy.links');

  return { title: t('name'), description: t('description'), ConfigForm };
}
