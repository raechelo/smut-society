'use client';

import { useState } from 'react';
import { HardcoverBook } from '@/lib/hardcover';
import { cn } from '@/lib/utils';
import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/app/pagination';
import Typography from '@/components/ui/typography';

// Three full cards per row, advancing three at a time. We render one extra card
// so it peeks in half-visible (and faded) as a hint that there's more — reset to
// the first row by remounting (pass a `key` that changes when results change).
const ROW_SIZE = 3;

// Each card is sized so 3.5 fit in the row: (row width − the 3 gaps before the
// half card) / 3.5. `overflow-hidden` clips the 4th card to its peeking half.
const CARD_BASIS = 'basis-[calc((100%-3*var(--spacing-md))/3.5)]';

export function BookGrid({
  title,
  books,
  favoritedIds,
  onFavoriteChange,
  shelfIds,
  onShelfChange,
}: {
  title: string;
  books: HardcoverBook[];
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
  shelfIds: Set<string>;
  onShelfChange: (bookId: string, onShelf: boolean) => void;
}) {
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(books.length / ROW_SIZE);
  const current = Math.min(page, Math.max(0, pageCount - 1));
  const start = current * ROW_SIZE;
  // Slice one extra for the peek card.
  const row = books.slice(start, start + ROW_SIZE + 1);

  return (
    <div>
      <div className='mb-2 flex justify-between'>
        <Typography
          variant='h3'
          display
          classNames='!mb-0 text-primary'
        >
          {title}
        </Typography>
        <Pagination
          hasPrevious={current > 0}
          hasNext={start + ROW_SIZE < books.length}
          onPrevious={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        />
      </div>
      {/* Single row; the extra card overflows and is clipped to a faded half. */}
      <div className='flex gap-md overflow-hidden'>
        {row.map((book, i) => {
          const isPeek = row.length > ROW_SIZE && i === ROW_SIZE;
          return (
            <div
              key={book.slug}
              aria-hidden={isPeek}
              className={cn(
                'shrink-0',
                CARD_BASIS,
                isPeek && 'pointer-events-none opacity-40'
              )}
            >
              <BookCard
                book={book}
                isFavorited={favoritedIds.has(book.slug)}
                onFavoriteChange={onFavoriteChange}
                isOnShelf={shelfIds.has(book.slug)}
                onShelfChange={onShelfChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BookGridSkeleton() {
  return (
    <div className='flex gap-md overflow-hidden'>
      {Array.from({ length: ROW_SIZE + 1 }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-[220px] shrink-0 rounded-md',
            CARD_BASIS,
            i === ROW_SIZE && 'opacity-40'
          )}
        />
      ))}
    </div>
  );
}
