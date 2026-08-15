'use client';

import {
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  Pagination as RawPagination,
} from '@/components/ui/pagination';

export const Pagination = ({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  return (
    <RawPagination className='mx-0 w-auto'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? undefined : -1}
            className={
              hasPrevious ? undefined : 'pointer-events-none opacity-40'
            }
            onClick={(e) => {
              e.preventDefault();
              if (hasPrevious) onPrevious();
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href='#'
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={hasNext ? undefined : 'pointer-events-none opacity-40'}
            onClick={(e) => {
              e.preventDefault();
              if (hasNext) onNext();
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </RawPagination>
  );
};
