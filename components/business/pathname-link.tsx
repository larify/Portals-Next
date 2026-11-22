'use client';

import { ChartNoAxesCombined, Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouteUrl } from '@/hooks/use-route-url';
import { SHORTCUT_ROUTES } from '@/lib/constants/shortcuts';
import type { ShortcutType } from '@/lib/types/shortcuts';

const ACTION_CLASS_NAME = 'shrink-0 cursor-pointer';

export function PathnameLink({
  pathname,
  shortcutType,
  id,
}: {
  pathname: string;
  shortcutType: ShortcutType;
  id: string;
}) {
  const t = useTranslations();
  const getRouteUrl = useRouteUrl(shortcutType);
  const href = getRouteUrl(pathname);
  const analyticsHref = `/analytics/${SHORTCUT_ROUTES[shortcutType]}/${encodeURIComponent(id)}`;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }

      setCopied(true);
      timer.current = setTimeout(() => {
        setCopied(false);
        timer.current = null;
      }, 2000);
      toast.success(t('shared.copySuccess'));
    } catch {
      toast.error(t('shared.copyError'));
    }
  }

  const analyticsLabel = t('admin.analytics.title');
  const copyLabel = t(copied ? 'shared.copySuccess' : 'shared.copyPath');
  const actionClassName = `${ACTION_CLASS_NAME} ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`;

  return (
    <div className="group inline-flex w-fit items-center gap-1.5">
      <TooltipProvider delay={500} timeout={0}>
        <Tooltip>
          <TooltipTrigger
            render={
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary focus-visible:ring-ring inline-flex h-8 items-center rounded-sm text-sm font-medium no-underline outline-none hover:no-underline focus-visible:ring-2"
              />
            }
          >
            {pathname}
          </TooltipTrigger>
          <TooltipContent side="top" className="break-all">
            {href}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="inline-flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          className={actionClassName}
          aria-label={analyticsLabel}
          nativeButton={false}
          render={<Link href={analyticsHref} />}
        >
          <ChartNoAxesCombined aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={actionClassName}
          aria-label={copyLabel}
          onClick={() => void copy()}
        >
          {copied ? <Check className="text-green-500 dark:text-green-400" /> : <Copy />}
        </Button>
      </span>
    </div>
  );
}
