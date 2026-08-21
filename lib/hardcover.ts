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
  // Extra Hardcover tag categories (populated from the books table's
  // cached_tags; empty on search-hit results). `tropes` is Hardcover's "Tag"
  // category — reading-experience descriptors, the closest thing to tropes.
  moods: string[];
  tropes: string[];
  contentWarnings: string[];
  pages: number | null;
  releaseYear: number | null;
  rating: number | null;
  ratingsCount: number | null;
  description: string | null;
  series: string | null;
  // The book's position within its series (from the books table); null when
  // standalone or unknown.
  seriesPosition: number | null;
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
    moods: Array.isArray(d.moods) ? d.moods : [],
    tropes: Array.isArray(d.tags) ? d.tags : [],
    contentWarnings: Array.isArray(d.content_warnings) ? d.content_warnings : [],
    pages: typeof d.pages === 'number' ? d.pages : null,
    releaseYear: typeof d.release_year === 'number' ? d.release_year : null,
    rating: typeof d.rating === 'number' ? d.rating : null,
    ratingsCount: typeof d.ratings_count === 'number' ? d.ratings_count : null,
    description: d.description ?? null,
    series: d.series_names?.[0] ?? null,
    seriesPosition: null,
  };
}

// Maps a row from the `books` table (contributions/cached_tags shape) rather
// than a search hit document.
function toBookFromTable(b: any): HardcoverBook {
  const ct = b.cached_tags ?? {};
  const tagList = (category: string): string[] =>
    Array.isArray(ct[category])
      ? ct[category].map((t: any) => t.tag).filter(Boolean)
      : [];
  const seriesEntry = Array.isArray(b.book_series) ? b.book_series[0] : null;
  return {
    id: Number(b.id),
    slug: b.slug,
    title: b.title,
    authors: (b.contributions ?? [])
      .map((c: any) => c.author?.name)
      .filter(Boolean),
    cover: b.image?.url ?? null,
    genres: tagList('Genre'),
    moods: tagList('Mood'),
    tropes: tagList('Tag'),
    contentWarnings: tagList('Content Warning'),
    pages: typeof b.pages === 'number' ? b.pages : null,
    releaseYear: typeof b.release_year === 'number' ? b.release_year : null,
    rating: typeof b.rating === 'number' ? b.rating : null,
    ratingsCount: typeof b.ratings_count === 'number' ? b.ratings_count : null,
    description: b.description ?? null,
    series: seriesEntry?.series?.name ?? null,
    seriesPosition:
      typeof seriesEntry?.position === 'number' ? seriesEntry.position : null,
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

export type SearchResult = { items: HardcoverBook[]; total: number };

// Full-text, paginated book search for the library. Cached per query/page.
const cachedSearchBooks = unstable_cache(
  async (q: string, perPage: number, page: number): Promise<SearchResult> => {
    const data = await hardcoverQuery<{ search: { results: any } }>(
      `query Search($q: String!, $per: Int!, $page: Int!) {
        search(query: $q, query_type: "Book", per_page: $per, page: $page) {
          results
        }
      }`,
      { q, per: perPage, page }
    );
    const results = data?.search?.results;
    const hits: any[] = results?.hits ?? [];
    return {
      items: hits.map((h) => toBook(h.document)).filter((b) => b.slug),
      total: typeof results?.found === 'number' ? results.found : hits.length,
    };
  },
  ['hardcover-search-books'],
  { revalidate: 60 * 60 }
);

export const searchBooks = cache(
  async (query: string, page = 1, perPage = 12): Promise<SearchResult> => {
    if (!query.trim()) return { items: [], total: 0 };
    return cachedSearchBooks(query.trim(), perPage, Math.max(1, page));
  }
);

// Popular romance (by reader count), paginated. Used for the default library
// grid when there's no active search/trope. Scoped to romance via the
// denormalized `cached_tags.Genre` — the consensus genre list Hardcover shows on
// a book, so it reflects agreement rather than a single user's stray tag (a
// plain `taggings` filter leaks mainstream titles like Harry Potter).
const cachedPopular = unstable_cache(
  async (perPage: number, page: number): Promise<HardcoverBook[]> => {
    const data = await hardcoverQuery<{ books: any[] }>(
      `query Popular($limit: Int!, $offset: Int!) {
        books(
          where: { cached_tags: { _contains: { Genre: [{ tag: "Romance" }] } } }
          order_by: { users_read_count: desc_nulls_last }
          limit: $limit
          offset: $offset
        ) {
          id
          slug
          title
          rating
          ratings_count
          release_year
          pages
          description
          image { url }
          cached_tags
          contributions { author { name } }
        }
      }`,
      { limit: perPage, offset: (page - 1) * perPage }
    );
    return (data?.books ?? []).map(toBookFromTable).filter((b) => b.slug);
  },
  ['hardcover-popular-romance'],
  { revalidate: 60 * 60 }
);

export const popularBooks = cache(
  (page = 1, perPage = 12): Promise<HardcoverBook[]> =>
    cachedPopular(perPage, Math.max(1, page))
);

export type TrendingWindow = 'week' | 'month' | 'three_month' | 'one_year' | 'all';

// Fields the book-card/hero need from a `books` table row (vs a search hit).
const BOOK_TABLE_FIELDS = `
  id
  slug
  title
  rating
  ratings_count
  release_year
  pages
  description
  image { url }
  cached_tags
  contributions { author { name } }
  book_series { position series { name } }
`;

// Trending romance in Hardcover's trending order. `books_trending` is global
// (mostly non-romance) and caps at 100 ids, so the romance slice is a small,
// deliberately curated set (~11 for a week, ~17 for a month) scoped by the same
// `cached_tags.Genre` filter as the popular grid.
async function fetchTrendingRomance(
  duration: TrendingWindow
): Promise<HardcoverBook[]> {
  const trending = await hardcoverQuery<{ books_trending: { ids: number[] } }>(
    `query Trending($d: TrendingDuration!) {
      books_trending(duration: $d, limit: 100) { ids }
    }`,
    { d: duration }
  );
  const ids: number[] = trending?.books_trending?.ids ?? [];
  if (ids.length === 0) return [];

  const data = await hardcoverQuery<{ books: any[] }>(
    `query TrendingBooks($ids: [Int!]!) {
      books(
        where: {
          id: { _in: $ids }
          cached_tags: { _contains: { Genre: [{ tag: "Romance" }] } }
        }
      ) {${BOOK_TABLE_FIELDS}}
    }`,
    { ids }
  );

  // Preserve Hardcover's trending order.
  const rank = new Map(ids.map((id, i) => [id, i] as const));
  return (data?.books ?? [])
    .filter((b) => b.slug)
    .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
    .map(toBookFromTable);
}

// The Trending section grid — revalidated hourly, keyed by window.
const cachedTrendingRomance = unstable_cache(
  (duration: TrendingWindow) => fetchTrendingRomance(duration),
  ['hardcover-trending-romance'],
  { revalidate: 60 * 60 }
);

export const trendingBooks = cache(
  (duration: TrendingWindow = 'month'): Promise<HardcoverBook[]> =>
    cachedTrendingRomance(duration)
);

// Resolve a single book by its Hardcover slug (our stored bookId). Used to
// rebuild cover/title/author + overall rating for a finished book from just the
// id we kept.
const cachedBookBySlug = unstable_cache(
  async (slug: string): Promise<HardcoverBook | null> => {
    const data = await hardcoverQuery<{ books: any[] }>(
      `query BySlug($slug: String!) {
        books(where: { slug: { _eq: $slug } }, limit: 1) {${BOOK_TABLE_FIELDS}}
      }`,
      { slug }
    );
    const b = data?.books?.[0];
    return b ? toBookFromTable(b) : null;
  },
  // v2: cached shape gained moods/tropes/contentWarnings/series fields.
  ['hardcover-book-by-slug-v2'],
  { revalidate: DAY }
);

export const bookBySlug = cache(
  (slug: string): Promise<HardcoverBook | null> =>
    slug.trim() ? cachedBookBySlug(slug.trim()) : Promise.resolve(null)
);

// The librarian's-pick highlight: the top trending romance, frozen per ISO week
// (fresh weekly, stable within it). Falls back to the top all-time-popular
// romance if a week's trending set has no romance.
const cachedLibrariansPick = unstable_cache(
  async (_weekKey: number): Promise<HardcoverBook | null> => {
    const trending = await fetchTrendingRomance('week');
    return trending[0] ?? (await popularBooks(1, 1))[0] ?? null;
  },
  ['hardcover-librarians-pick'],
  { revalidate: 7 * DAY }
);

const WEEK_MS = 7 * DAY * 1000;
export const librariansPick = cache(
  (): Promise<HardcoverBook | null> =>
    cachedLibrariansPick(Math.floor(Date.now() / WEEK_MS))
);
/* eslint-enable @typescript-eslint/no-explicit-any */
