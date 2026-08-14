'use client';

import { useEffect, useState } from 'react';
import type { GoogleBook } from '@/lib/types/books';
import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import Typography from '@/components/ui/typography';

// Curated browse shelves shown before the user searches. Each shelf is one
// Google Books subject query, run through the same /api/books/search route
// (so English + relevance filtering applies). Note: Google Books has no
// bestseller/rating data to speak of, so these are genre shelves, not "top 10".
type Shelf = {
  label: string;
  query: string;
  orderBy?: 'relevance' | 'newest';
};

const SHELVES: Shelf[] = [
  { label: 'Fantasy Romance', query: 'subject:fantasy subject:romance' },
  { label: 'Dark Romance', query: 'subject:"dark romance"' },
  { label: 'Greek Mythology', query: 'subject:"greek mythology"' },
  { label: 'Paranormal & Vampires', query: 'subject:romance vampire' },
  { label: 'Romance', query: 'subject:romance' },
];

const SHELF_LIMIT = 12;

function ShelfRow({
  shelf,
  favoritedIds,
  onFavoriteChange,
}: {
  shelf: Shelf;
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
}) {
  const [books, setBooks] = useState<GoogleBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      q: shelf.query,
      orderBy: shelf.orderBy ?? 'relevance',
    });
    fetch(`/api/books/search?${params}`)
      .then((r) => r.json())
      .then(({ items }: { items?: GoogleBook[] }) => {
        if (!cancelled) setBooks((items ?? []).slice(0, SHELF_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [shelf.query, shelf.orderBy]);

  // Hide shelves that resolved to nothing rather than show an empty heading.
  if (books && books.length === 0) return null;

  return (
    <section className='flex flex-col gap-sm'>
      <Typography variant='h2'>{shelf.label}</Typography>
      <div className='flex gap-md overflow-x-auto pb-xs'>
        {(books ?? Array.from({ length: 4 }).map(() => null)).map((book, i) =>
          book ? (
            <div
              key={book.id}
              className='w-[320px] shrink-0'
            >
              <BookCard
                book={book}
                isFavorited={favoritedIds.has(book.id)}
                onFavoriteChange={onFavoriteChange}
              />
            </div>
          ) : (
            <div
              key={i}
              className='w-[320px] shrink-0'
            >
              <Skeleton className='h-[200px] w-full rounded-md' />
            </div>
          )
        )}
      </div>
    </section>
  );
}

export function Discover({
  favoritedIds,
  onFavoriteChange,
}: {
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
}) {
  return (
    <div className='flex flex-col gap-lg'>
      {SHELVES.map((shelf) => (
        <ShelfRow
          key={shelf.label}
          shelf={shelf}
          favoritedIds={favoritedIds}
          onFavoriteChange={onFavoriteChange}
        />
      ))}
    </div>
  );
}
