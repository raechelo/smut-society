import { cache } from 'react';
import { unstable_cache } from 'next/cache';

const ENDPOINT = 'https://api.hardcover.app/v1/graphql';
const DAY = 60 * 60 * 24;

// Metadata resolved from Hardcover — the curated default-edition cover plus the
// fields the book views need. Extra arrays (genres/moods/contentWarnings/series)
// are real data we can use to replace the currently-reading placeholders.
export type HardcoverMeta = {
  hardcoverId: number;
  slug: string | null;
  title: string;
  author: string | null;
  cover: string | null;
  genre: string | null;
  series: string | null;
  pageCount: number | null;
  publishedYear: string | null;
  averageRating: number | null;
  genres: string[];
  moods: string[];
  contentWarnings: string[];
};

// A search result for the library — the fields a book card renders. `slug` is
// our stored book id going forward (clean for links).
export type HardcoverBook = {
  id: number;
  slug: string;
  title: string;
  authors: string[];
  cover: string | null;
  genres: string[];
  pages: number | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number | null;
  description: string | null;
  series: string | null;
};

function authHeader(token: string) {
  // Tokens from the settings page are raw JWTs; add the scheme if it's missing.
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

async function hardcoverQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  const token = process.env.HARDCOVER_API_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: authHeader(token),
        'user-agent': 'smut-society/1.0',
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) {
      console.error('Hardcover GraphQL errors', json.errors);
      return null;
    }
    return json.data as T;
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toMeta(d: any): HardcoverMeta {
  const genres: string[] = Array.isArray(d.genres) ? d.genres : [];
  const moods: string[] = Array.isArray(d.moods) ? d.moods : [];
  return {
    hardcoverId: Number(d.id),
    slug: d.slug ?? null,
    title: d.title,
    author: d.author_names?.[0] ?? null,
    cover: d.image?.url ?? null,
    genre: genres[0] ?? null,
    series: d.series_names?.[0] ?? null,
    pageCount: typeof d.pages === 'number' ? d.pages : null,
    publishedYear: d.release_year ? String(d.release_year) : null,
    averageRating: typeof d.rating === 'number' ? d.rating : null,
    genres,
    moods,
    contentWarnings: Array.isArray(d.content_warnings) ? d.content_warnings : [],
  };
}

function toBook(d: any): HardcoverBook {
  return {
    id: Number(d.id),
    slug: d.slug,
    title: d.title,
    authors: Array.isArray(d.author_names) ? d.author_names : [],
    cover: d.image?.url ?? null,
    genres: Array.isArray(d.genres) ? d.genres : [],
    pages: typeof d.pages === 'number' ? d.pages : null,
    releaseYear: typeof d.release_year === 'number' ? d.release_year : null,
    rating: typeof d.rating === 'number' ? d.rating : null,
    ratingsCount: typeof d.ratings_count === 'number' ? d.ratings_count : null,
    description: d.description ?? null,
    series: d.series_names?.[0] ?? null,
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// The uncached search+map, keyed by the full query string and the title we want
// to match. Hardcover is a POST, so Next's fetch cache doesn't apply — wrap the
// whole thing in unstable_cache so results persist across requests for a day
// (keeps us well under the 60 req/min limit).
const cachedSearchBookMeta = unstable_cache(
  async (q: string, matchTitle: string): Promise<HardcoverMeta | null> => {
    const data = await hardcoverQuery<{ search: { results: any } }>(
      `query Search($q: String!) {
        search(query: $q, query_type: "Book", per_page: 5, page: 1) {
          results
        }
      }`,
      { q }
    );

    const hits: any[] = data?.search?.results?.hits ?? [];
    if (hits.length === 0) return null;

    // Prefer an exact title match; otherwise take the most-read result (first).
    const want = norm(matchTitle);
    const best =
      hits.find((h) => norm(h.document?.title ?? '') === want)?.document ??
      hits[0].document;
    return toMeta(best);
  },
  ['hardcover-book-meta'],
  { revalidate: DAY }
);

// Look up a book on Hardcover by title (and author) and return the best match's
// metadata + curated cover. React cache() dedupes within a request; the
// unstable_cache above dedupes across requests. Bridges our stored Google Books
// data to Hardcover without needing a Hardcover id up front.
export const searchBookMeta = cache(
  async (
    title: string,
    author?: string | null
  ): Promise<HardcoverMeta | null> => {
    const q = [title, author].filter(Boolean).join(' ');
    if (!q.trim()) return null;
    return cachedSearchBookMeta(q, title);
  }
);

// Full-text book search for the library. Cached per query across requests.
const cachedSearchBooks = unstable_cache(
  async (q: string, limit: number): Promise<HardcoverBook[]> => {
    const data = await hardcoverQuery<{ search: { results: any } }>(
      `query Search($q: String!, $per: Int!) {
        search(query: $q, query_type: "Book", per_page: $per, page: 1) {
          results
        }
      }`,
      { q, per: limit }
    );
    const hits: any[] = data?.search?.results?.hits ?? [];
    return hits.map((h) => toBook(h.document)).filter((b) => b.slug);
  },
  ['hardcover-search-books'],
  { revalidate: 60 * 60 }
);

export const searchBooks = cache(
  async (query: string, limit = 20): Promise<HardcoverBook[]> => {
    if (!query.trim()) return [];
    return cachedSearchBooks(query.trim(), limit);
  }
);
/* eslint-enable @typescript-eslint/no-explicit-any */
