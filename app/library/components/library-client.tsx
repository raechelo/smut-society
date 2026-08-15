'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DEFAULT_FILTERS,
  matchesLength,
  type BookFilters,
} from '@/lib/types/books';
import type { HardcoverBook } from '@/lib/hardcover';
import { Filter } from './filter';
import { BookCard } from './book-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Chip } from '@/components/app/chip';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { getUserFavoriteIds, getUserShelfIds } from '@/lib/actions/books';

const PER_PAGE = 12;
const TROPES = [
  'Enemies to Lovers',
  'Slow Burn',
  'Grumpy Sunshine',
  'Fake Dating',
  'Second Chance',
  'Forced Proximity',
  'Found Family',
  'Forbidden Love',
  'Fated Mates',
  'Friends to Lovers',
];

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
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-[220px] w-full rounded-md'
        />
      ))}
    </div>
  );
}

export function LibraryClient() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [filters, setFilters] = useState<BookFilters>(DEFAULT_FILTERS);
  const [activeTrope, setActiveTrope] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rawBooks, setRawBooks] = useState<HardcoverBook[]>([]);
  const [hasMore, setHasMore] = useState(false);
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
    const timer = setTimeout(() => {
      setDebouncedInput(inputValue.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Query terms: search + selected trope + genre filters. Falls back to a
  // popular query when nothing is selected.
  const userQuery = [debouncedInput, activeTrope, ...filters.genres]
    .filter(Boolean)
    .join(' ')
    .trim();
  const isPopular = !userQuery;

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Empty query → the API returns the popular grid.
    const params = new URLSearchParams({
      q: userQuery,
      page: String(page),
      per: String(PER_PAGE),
    });

    fetch(`/api/hardcover/search?${params}`)
      .then((r) => r.json())
      .then(({ items, hasMore, error }) => {
        if (cancelled) return;
        if (error) setError(error);
        else {
          setRawBooks(items ?? []);
          setHasMore(!!hasMore);
        }
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
  }, [userQuery, page]);

  const filtered =
    filters.lengths.length > 0
      ? rawBooks.filter((b) => matchesLength(b.pages, filters.lengths))
      : rawBooks;
  const books =
    filters.sortBy === 'newest'
      ? [...filtered].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
      : filtered;

  const hasPrev = page > 1;
  const hasNext = hasMore;
  const title = isPopular ? 'Popular books' : (activeTrope ?? 'Results');

  const toggleTrope = (t: string) => {
    setActiveTrope((cur) => (cur === t ? null : t));
    setPage(1);
  };

  return (
    <div className='flex flex-col gap-md'>
      <Filter
        value={inputValue}
        onChange={setInputValue}
        filters={filters}
        onFiltersChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />

      {/* Browse by trope */}
      <div className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
        >
          Browse by trope
        </Typography>
        <div className='flex flex-wrap gap-1.5'>
          {TROPES.map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => toggleTrope(t)}
              className='cursor-pointer'
              aria-pressed={activeTrope === t}
            >
              <Chip
                label={t}
                size='small'
                variant={activeTrope === t ? 'filled' : 'outline'}
                colors='wine'
              />
            </button>
          ))}
        </div>
      </div>

      {/* Popular / results */}
      <section className='flex flex-col gap-sm'>
        <div className='flex items-center justify-between gap-sm'>
          <Typography
            variant='h4'
            display
            classNames='!mb-0 text-primary'
          >
            {title}
          </Typography>
          <div className='flex items-center gap-1.5'>
            <Button
              size='icon-sm'
              variant='outline'
              disabled={!hasPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label='Previous page'
            >
              <ChevronLeft className='size-4' />
            </Button>
            <Button
              size='icon-sm'
              variant='outline'
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label='Next page'
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>

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
        ) : (
          <Typography
            variant='p2'
            color='muted'
            classNames='mt-xl text-center'
          >
            No books found
          </Typography>
        )}
      </section>
    </div>
  );
}
