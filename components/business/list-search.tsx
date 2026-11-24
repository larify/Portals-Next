'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ListSearch({
  search,
  placeholder,
  onSearch,
}: {
  search: string;
  placeholder: string;
  onSearch: (search: string) => void;
}) {
  const t = useTranslations();
  const [value, setValue] = useState(search);
  const input = useRef<HTMLInputElement>(null);
  const clearLabel = t('shared.clearSearch');

  return (
    <form
      className="w-full sm:w-80"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value.trim());
      }}
    >
      <InputGroup>
        <InputGroupInput
          ref={input}
          inputMode="search"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <InputGroupAddon align="inline-end">
          {value && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={clearLabel}
                    onClick={() => {
                      setValue('');
                      input.current?.focus();
                      onSearch('');
                    }}
                  />
                }
              >
                <X aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="top">{clearLabel}</TooltipContent>
            </Tooltip>
          )}
          <InputGroupButton type="submit" size="icon-xs" aria-label={t('shared.search')}>
            <Search aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
