'use client';

import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RouteDrawerProps } from './route-drawer';

export function RouteListTitle({
  drawer: Drawer,
  item,
  disabled,
  onUpdated,
}: {
  drawer: ComponentType<RouteDrawerProps>;
  item: { id: string; name: string; description: string | null };
  disabled: boolean;
  onUpdated: () => void;
}) {
  return (
    <Tooltip>
      <Drawer
        id={item.id}
        onSaved={onUpdated}
        disabled={disabled}
        triggerLabel={item.name}
        trigger={
          <TooltipTrigger
            render={
              <Button
                variant="link"
                size="sm"
                className="block h-auto max-w-full cursor-pointer truncate p-0 text-left font-medium hover:no-underline"
                disabled={disabled}
              />
            }
          />
        }
      />
      <TooltipContent side="top" className="break-words whitespace-pre-wrap">
        {item.description || item.name}
      </TooltipContent>
    </Tooltip>
  );
}
