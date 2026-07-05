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

function BookGrid({ books }: { books: GoogleBook[] }) {
  return (
    <div className='grid grid-cols-2 gap-md sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
        />
      ))}
    </div>
  );
}

function BookGridSkeleton() {
  return (
    <div className='grid grid-cols-2 gap-md sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
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

const DEFAULT_SUBJECTS = 'subject:fiction|subject:romance|subject:erotica';

function buildQuery(input: string, genres: string[]): string {
  const base = input.trim();
  if (!base && !genres.length) return '';
  const subjectClause = genres.length
    ? genres.map((g) => `subject:${g}`).join('|')
    : DEFAULT_SUBJECTS;
  return base ? `${base} ${subjectClause}` : subjectClause;
}

export function LibraryClient() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_FILTERS);
  const [rawBooks, setRawBooks] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <BookGrid books={books} />
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
