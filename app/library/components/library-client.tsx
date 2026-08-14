'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_FILTERS,
  matchesLength,
  type BookFilters,
  type GoogleBook,
} from '@/lib/types/books';
import { Filter } from './filter';
import { BookCard } from './book-card';
import { Discover } from './discover';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserFavoriteIds } from '@/lib/actions/books';

function BookGrid({
  books,
  favoritedIds,
  onFavoriteChange,
}: {
  books: GoogleBook[];
  favoritedIds: Set<string>;
  onFavoriteChange: (bookId: string, favorited: boolean) => void;
}) {
  return (
    <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          isFavorited={favoritedIds.has(book.id)}
          onFavoriteChange={onFavoriteChange}
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

const DEFAULT_SUBJECTS = 'subject:(fiction OR romance OR erotica OR fantasy)';

function subjectClause(genres: string[]): string {
  const terms = genres.map((g) => `"${g}"`).join(' OR ');
  return `subject:(${terms})`;
}

function titleClause(input: string): string {
  const words = input.replace(/"/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return `intitle:${words[0] ?? ''}`;
  const phrase = words.slice(0, -1).join(' ');
  const last = words[words.length - 1];
  return `intitle:"${phrase}" ${last}`;
}

function buildQuery(input: string, genres: string[]): string {
  const base = input.trim();
  if (!base && !genres.length) return '';

  const titlePart = base ? titleClause(base) : '';

  if (!genres.length) return titlePart || DEFAULT_SUBJECTS;

  const clause = subjectClause(genres);
  return titlePart ? `${titlePart} ${clause}` : clause;
}

export function LibraryClient() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_FILTERS);
  const [rawBooks, setRawBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getUserFavoriteIds().then((ids) => setFavoritedIds(new Set(ids)));
  }, []);

  const handleFavoriteChange = (bookId: string, favorited: boolean) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(bookId);
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

    const params = new URLSearchParams({
      q: apiQuery,
      orderBy: filters.sortBy,
    });

    fetch(`/api/books/search?${params}`)
      .then((r) => r.json())
      .then(({ items, error }) => {
        if (cancelled) return;
        if (error) setError(error);
        else setRawBooks(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiQuery, filters.sortBy]);

  const books =
    filters.lengths.length > 0
      ? rawBooks.filter((b) =>
          matchesLength(b.volumeInfo.pageCount, filters.lengths)
        )
      : rawBooks;

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
          <p className='mt-xl text-center text-sm text-destructive'>{error}</p>
        ) : books.length > 0 ? (
          <BookGrid
            books={books}
            favoritedIds={favoritedIds}
            onFavoriteChange={handleFavoriteChange}
          />
        ) : hasQuery ? (
          <p className='mt-xl text-center text-sm text-muted-foreground'>
            No books found
          </p>
        ) : (
          <Discover
            favoritedIds={favoritedIds}
            onFavoriteChange={handleFavoriteChange}
          />
        )}
      </div>
    </div>
  );
}
