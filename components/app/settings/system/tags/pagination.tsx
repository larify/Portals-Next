'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TagPaginationProps {
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  disabled: boolean;
}

export function TagPagination({ total, page, size, onPageChange, onSizeChange, disabled }: TagPaginationProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
      <span className="text-muted-foreground text-sm">{t('shared.total', { count: total })}</span>
      <nav className="flex items-center gap-1" aria-label={t('shared.pagination')}>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('shared.previousPage')}
        >
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" aria-current="page" disabled={disabled}>
          {page}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={disabled || page * size >= total}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('shared.nextPage')}
        >
          <ChevronRight />
        </Button>
      </nav>
      <Select
        disabled={disabled}
        value={String(size)}
        onValueChange={(value) => {
          if (value !== null) {
            onSizeChange(Number(value));
          }
        }}
        items={[10, 20, 50].map((size) => ({ value: String(size), label: t('shared.pageSize', { count: size }) }))}
      >
        <SelectTrigger size="sm" aria-label={t('shared.rowsPerPage')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="bottom" alignItemWithTrigger={false} className="w-max min-w-0">
          {[10, 20, 50].map((size) => (
            <SelectItem key={size} value={String(size)}>
              {t('shared.pageSize', { count: size })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
