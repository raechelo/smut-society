'use client';

import { useEffect, useState } from 'react';
import type { HardcoverBook } from '@/lib/hardcover';
import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import Typography from '@/components/ui/typography';

// Curated browse shelves shown before the user searches. Each shelf is one
// full-text query run through Hardcover's search.
type Shelf = {
  label: string;
  query: string;
};

const SHELVES: Shelf[] = [
  { label: 'Fantasy Romance', query: 'fantasy romance' },
  { label: 'Dark Romance', query: 'dark romance' },
  { label: 'Greek Mythology', query: 'greek mythology romance' },
  { label: 'Paranormal & Vampires', query: 'vampire romance' },
  { label: 'Romance', query: 'romance' },
];

const SHELF_LIMIT = 12;

function ShelfRow({
  shelf,
  favoritedIds,
  onFavoriteChange,
  shelfIds,
  onShelfChange,
}: {
  shelf: Shelf;
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
  shelfIds: Set<string>;
  onShelfChange: (bookId: string, onShelf: boolean) => void;
}) {
  const [books, setBooks] = useState<HardcoverBook[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ q: shelf.query });
    fetch(`/api/hardcover/search?${params}`)
      .then((r) => r.json())
      .then(({ items }: { items?: HardcoverBook[] }) => {
        if (!cancelled) setBooks((items ?? []).slice(0, SHELF_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setBooks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [shelf.query]);

  // Hide shelves that resolved to nothing rather than show an empty heading.
  if (books && books.length === 0) return null;

  return (
    <section className='flex flex-col gap-sm'>
      <Typography
        variant='h2'
        display
      >
        {shelf.label}
      </Typography>
      <div className='flex gap-md overflow-x-auto pb-xs'>
        {(books ?? Array.from({ length: 4 }).map(() => null)).map((book, i) =>
          book ? (
            <div
              key={book.slug}
              className='w-[320px] shrink-0'
            >
              <BookCard
                book={book}
                isFavorited={favoritedIds.has(book.slug)}
                onFavoriteChange={onFavoriteChange}
                isOnShelf={shelfIds.has(book.slug)}
                onShelfChange={onShelfChange}
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
  shelfIds,
  onShelfChange,
}: {
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
  shelfIds: Set<string>;
  onShelfChange: (bookId: string, onShelf: boolean) => void;
}) {
  return (
    <div className='flex flex-col gap-lg'>
      {SHELVES.map((shelf) => (
        <ShelfRow
          key={shelf.label}
          shelf={shelf}
          favoritedIds={favoritedIds}
          onFavoriteChange={onFavoriteChange}
          shelfIds={shelfIds}
          onShelfChange={onShelfChange}
        />
      ))}
    </div>
  );
}
