'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_FILTERS,
  matchesLength,
  type BookFilters,
} from '@/lib/types/books';
import type { HardcoverBook } from '@/lib/hardcover';
import { Filter } from './filter';
import { BookCard } from './book-card';
import { Discover } from './discover';
import { Skeleton } from '@/components/ui/skeleton';
import Typography from '@/components/ui/typography';
import { getUserFavoriteIds, getUserShelfIds } from '@/lib/actions/books';

function BookGrid({
  books,
  favoritedIds,
  onFavoriteChange,
  shelfIds,
  onShelfChange,
}: {
  books: HardcoverBook[];
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
  shelfIds: Set<string>;
  onShelfChange: (bookId: string, onShelf: boolean) => void;
}) {
  return (
    <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
      {books.map((book) => (
        <BookCard
          key={book.slug}
          book={book}
          isFavorited={favoritedIds.has(book.slug)}
          onFavoriteChange={onFavoriteChange}
          isOnShelf={shelfIds.has(book.slug)}
          onShelfChange={onShelfChange}
        />
      ))}
    </div>
  );
}

function BookGridSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className='flex flex-col gap-sm'
        >
          <Skeleton className='aspect-[2/3] w-full rounded-md' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-3 w-1/2' />
        </div>
      ))}
    </div>
  );
}

// Hardcover's search is full-text (Typesense) — no field operators. Combine the
// user's text with any selected genre terms into one query.
function buildQuery(input: string, genres: string[]): string {
  return [input.trim(), ...genres].filter(Boolean).join(' ').trim();
}

export function LibraryClient() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_FILTERS);
  const [rawBooks, setRawBooks] = useState<HardcoverBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [shelfIds, setShelfIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getUserFavoriteIds().then((ids) => setFavoritedIds(new Set(ids)));
    getUserShelfIds().then((ids) => setShelfIds(new Set(ids)));
  }, []);

  const handleFavoriteChange = (bookId: string, favorited: boolean) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(bookId);
      else next.delete(bookId);
      return next;
    });
  };

  const handleShelfChange = (bookId: string, onShelf: boolean) => {
    setShelfIds((prev) => {
      const next = new Set(prev);
      if (onShelf) next.add(bookId);
      else next.delete(bookId);
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputValue.trim()), 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const apiQuery = buildQuery(debouncedInput, filters.genres);

  useEffect(() => {
    if (!apiQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRawBooks([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ q: apiQuery });

    fetch(`/api/hardcover/search?${params}`)
      .then((r) => r.json())
      .then(({ items, error }) => {
        if (cancelled) return;
        if (error) setError(error);
        else setRawBooks(items);
      })
      .catch(() => {
        if (!cancelled) setError('Search failed. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiQuery]);

  const filtered =
    filters.lengths.length > 0
      ? rawBooks.filter((b) => matchesLength(b.pages, filters.lengths))
      : rawBooks;
  const books =
    filters.sortBy === 'newest'
      ? [...filtered].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
      : filtered;

  const hasQuery = !!apiQuery;

  return (
    <div className='flex h-full flex-col gap-md'>
      <Filter
        value={inputValue}
        onChange={setInputValue}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className='min-h-0 flex-1 overflow-y-auto pr-xs'>
        {loading ? (
          <BookGridSkeleton />
        ) : error ? (
          <Typography
            variant='p2'
            color='error'
            classNames='mt-xl text-center'
          >
            {error}
          </Typography>
        ) : books.length > 0 ? (
          <BookGrid
            books={books}
            favoritedIds={favoritedIds}
            onFavoriteChange={handleFavoriteChange}
            shelfIds={shelfIds}
            onShelfChange={handleShelfChange}
          />
        ) : hasQuery ? (
          <Typography
            variant='p2'
            color='muted'
            classNames='mt-xl text-center'
          >
            No books found
          </Typography>
        ) : (
          <Discover
            favoritedIds={favoritedIds}
            onFavoriteChange={handleFavoriteChange}
            shelfIds={shelfIds}
            onShelfChange={handleShelfChange}
          />
        )}
      </div>
    </div>
  );
}
