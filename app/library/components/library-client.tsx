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
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import { getUserFavoriteIds, getUserShelfIds } from '@/lib/actions/books';
import { Trending } from './trending';
import { BookGrid, BookGridSkeleton } from './book-grid';

// Fetch a batch big enough to page through as single rows client-side.
const PER_PAGE = 24;
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

export function LibraryClient({ trending }: { trending: HardcoverBook[] }) {
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

  // Trending only belongs on the default browse view — hide it once the user is
  // narrowing by search, trope, genre (all folded into `userQuery`), or length.
  const isDefaultView = isPopular && filters.lengths.length === 0;

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
      ? [...filtered].sort(
          (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)
        )
      : filtered;

  const title = isPopular ? 'Popular books' : activeTrope ?? 'Results';

  const toggleTrope = (t: string) => {
    setActiveTrope((cur) => (cur === t ? null : t));
    setPage(1);
  };

  if (loading) {
    return <BookGridSkeleton />;
  }

  if (error) {
    return (
      <Typography
        variant='p2'
        color='error'
        classNames='mt-xl text-center'
      >
        {error}
      </Typography>
    );
  }

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

      {isDefaultView && trending.length > 0 && (
        <Trending
          trending={trending}
          favoritedIds={favoritedIds}
          handleFavoriteChange={handleFavoriteChange}
          shelfIds={shelfIds}
          handleShelfChange={handleShelfChange}
        />
      )}

      <section className='flex flex-col gap-sm'>
        {books.length > 0 ? (
          <BookGrid
            key={`${userQuery}|${filters.sortBy}|${filters.lengths.join(',')}`}
            title={title}
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
