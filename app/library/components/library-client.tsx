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

const DEFAULT_SUBJECTS = 'subject:(fiction OR romance OR erotica)';

// Google Books widens a subject search with `subject:(a OR b)`, NOT
// `subject:a|subject:b` — the `|` form silently returns zero results. Genre
// values can be multi-word (e.g. "dark romance"), so quote each one.
function subjectClause(genres: string[]): string {
  const terms = genres.map((g) => `"${g}"`).join(' OR ');
  return `subject:(${terms})`;
}

// Scope typed text to the title field. A plain Google Books query ranks by
// full-text relevance across the whole book, so short partial titles ("a touch
// of") match inside dictionaries and magazines and bury the real books. Quoting
// keeps the words together so an as-you-type prefix matches the start of a title
// (e.g. `intitle:"a touch of"` → "A Touch of Darkness").
function titleClause(input: string): string {
  return `intitle:"${input.replace(/"/g, '')}"`;
}

function buildQuery(input: string, genres: string[]): string {
  const base = input.trim();
  if (!base && !genres.length) return '';

  const titlePart = base ? titleClause(base) : '';

  // No explicit genre filter: bias toward on-theme subjects only when browsing
  // (empty search box). Appending subjects to a typed title would just narrow a
  // specific search that already works on its own.
  if (!genres.length) return titlePart || DEFAULT_SUBJECTS;

  // Explicit genre filter selected — honor it, optionally alongside typed text.
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
          <BookGrid books={books} favoritedIds={favoritedIds} onFavoriteChange={handleFavoriteChange} />
        ) : hasQuery ? (
          <p className='mt-xl text-center text-sm text-muted-foreground'>
            No books found
          </p>
        ) : (
          <p className='mt-xl text-center text-sm text-muted-foreground'>
            Search for a book to get started
          </p>
        )}
      </div>
    </div>
  );
}
