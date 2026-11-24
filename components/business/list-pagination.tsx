'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginationParams } from '@/lib/types/pagination';

const PAGE_SIZES = [10, 20, 50];

function getPageItems(page: number, pageCount: number): (number | 'startEllipsis' | 'endEllipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'endEllipsis', pageCount];
  }

  if (page >= pageCount - 3) {
    return [1, 'startEllipsis', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, 'startEllipsis', page - 1, page, page + 1, 'endEllipsis', pageCount];
}

export function ListPagination({
  page,
  size,
  total,
  disabled,
  onChange,
}: PaginationParams & {
  total: number;
  disabled: boolean;
  onChange(value: PaginationParams): void;
}) {
  const t = useTranslations();

  if (total <= 0) {
    return null;
  }

  const pageCount = Math.ceil(total / size);
  const previousDisabled = disabled || page <= 1;
  const nextDisabled = disabled || page >= pageCount;
  const pageSizeItems = PAGE_SIZES.map((value) => ({ value, label: t('shared.pageSize', { count: value }) }));

  function changePage(nextPage: number) {
    if (!disabled && nextPage !== page && nextPage >= 1 && nextPage <= pageCount) {
      onChange({ page: nextPage, size });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
      <span className="text-muted-foreground text-sm">{t('shared.total', { count: total })}</span>
      <Pagination className="mx-0 w-auto max-w-full" aria-label={t('shared.pagination')}>
        <PaginationContent className="flex-wrap justify-end">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={previousDisabled}
              onClick={() => changePage(page - 1)}
              aria-label={t('shared.previousPage')}
            >
              <ChevronLeft />
            </Button>
          </PaginationItem>
          {getPageItems(page, pageCount).map((item) => (
            <PaginationItem key={item}>
              {typeof item === 'number' ? (
                <PaginationLink
                  size="icon-sm"
                  isActive={item === page}
                  aria-label={t('shared.pageNumber', { page: item })}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  onClick={() => changePage(item)}
                >
                  {item}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={nextDisabled}
              onClick={() => changePage(page + 1)}
              aria-label={t('shared.nextPage')}
            >
              <ChevronRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <Select
        disabled={disabled}
        value={size}
        onValueChange={(value) => {
          if (value !== null) {
            onChange({ size: value, page: 1 });
          }
        }}
        items={pageSizeItems}
      >
        <SelectTrigger size="sm" aria-label={t('shared.rowsPerPage')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" alignItemWithTrigger={false}>
          {pageSizeItems.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
