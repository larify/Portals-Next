'use client';

import { ImageIcon, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isRecord } from '@/lib/shared/data';

const ICON_SETS = [
  { name: 'Qure', url: 'https://raw.githubusercontent.com/Koolson/Qure/master/Other/QureColor-All.json' },
  { name: 'Orz-3', url: 'https://raw.githubusercontent.com/Orz-3/mini/master/Color+.json' },
] as const;

interface CatalogIcon {
  name: string;
  url: string;
}

type CatalogState = { status: 'loading' | 'error' } | { status: 'ready'; icons: CatalogIcon[] };

interface IconPickerProps {
  id: string;
  value: string;
  disabled: boolean;
  onChange(url: string): void;
}

function isCatalogIcon(value: unknown): value is CatalogIcon {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    value.url.startsWith('https://raw.githubusercontent.com/')
  );
}

function IconGrid({ source, value, onSelect }: { source: string; value: string; onSelect(url: string): void }) {
  const t = useTranslations('workflowNodes.proxy.links');
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(source, { signal: controller.signal });

        if (!response.ok) {
          throw new Error();
        }

        const data: unknown = await response.json();
        const icons = isRecord(data) && Array.isArray(data.icons) ? data.icons.filter(isCatalogIcon) : [];

        if (!icons.length) {
          throw new Error();
        }

        if (!controller.signal.aborted) {
          setCatalog({ status: 'ready', icons });
        }
      } catch {
        if (!controller.signal.aborted) {
          setCatalog({ status: 'error' });
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [source]);

  return (
    <ScrollArea className="h-[min(16rem,40dvh)] [&>[data-slot=scroll-area-viewport]]:overscroll-contain">
      {catalog.status === 'ready' ? (
        <div className="grid grid-cols-6 gap-1 p-1 pr-3">
          {catalog.icons.map((icon) => (
            <Button
              key={icon.url}
              type="button"
              variant={value === icon.url ? 'secondary' : 'ghost'}
              size="icon"
              aria-label={icon.name}
              aria-pressed={value === icon.url}
              title={icon.name}
              onClick={() => onSelect(icon.url)}
            >
              <Image src={icon.url} alt="" width={24} height={24} unoptimized className="size-6 object-contain" />
            </Button>
          ))}
        </div>
      ) : (
        <p role="status" className="text-muted-foreground grid h-full place-items-center px-2 text-center">
          {t(catalog.status === 'loading' ? 'loadingIcons' : 'iconLoadFailed')}
        </p>
      )}
    </ScrollArea>
  );
}

export function IconPicker({ id, value, disabled, onChange }: IconPickerProps) {
  const t = useTranslations('workflowNodes.proxy.links');
  const [open, setOpen] = useState(false);
  const iconUrl = value.trim();

  return (
    <Popover open={!disabled && open} onOpenChange={setOpen}>
      <div className="flex w-full min-w-0 items-center gap-2">
        <Input
          id={id}
          className="min-w-0 flex-1"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-input rounded-full"
              aria-label={t('chooseIcon')}
              disabled={disabled}
            />
          }
        >
          <Avatar className="size-full after:hidden">
            {iconUrl && <AvatarImage src={iconUrl} alt="" />}
            <AvatarFallback>{iconUrl ? <ImageIcon className="size-4" /> : <Plus className="size-4" />}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" aria-label={t('chooseIcon')} className="max-w-[calc(100vw-2rem)] gap-2 p-2">
        <Tabs defaultValue={ICON_SETS[0].name}>
          <TabsList className="w-full" aria-label={t('chooseIcon')}>
            {ICON_SETS.map(({ name }) => (
              <TabsTrigger key={name} value={name}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          {ICON_SETS.map(({ name, url }) => (
            <TabsContent key={name} value={name} keepMounted>
              <IconGrid
                source={url}
                value={value}
                onSelect={(icon) => {
                  onChange(icon);
                  setOpen(false);
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
