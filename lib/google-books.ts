import type { GoogleBook } from '@/lib/types/books';

// The subset of Google Books volume metadata the currently-reading card needs.
// null fields mean Google didn't supply them for this volume.
export type BookMeta = {
  genre: string | null;
  pageCount: number | null;
  publishedYear: string | null;
  averageRating: number | null;
  cover: string | null;
};

// Google's thumbnail URLs come back as http, low zoom, with a page-curl overlay.
// Force https, bump the zoom for a crisper image, and drop the curl.
function normalizeCover(url: string | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/^http:/, 'https:')
    .replace('zoom=1', 'zoom=2')
    .replace('&edge=curl', '');
}

// The ISBN/edition Google returns often points at an obscure printing whose
// cover isn't the familiar one. Open Library groups editions under a work and
// exposes a representative `cover_i` — usually the well-known cover. (Same
// source as /api/books/cover.) Returns a large cover URL, or null.
async function getWellKnownCover(
  title: string,
  author: string | undefined
): Promise<string | null> {
  const params = new URLSearchParams({ title, limit: '1', fields: 'cover_i' });
  if (author) params.set('author', author);
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    return typeof coverId === 'number'
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;
  } catch {
    return null;
  }
}

// Google categories look like "Fiction / Romance / Fantasy" — take the most
// specific (last) segment and title-case it for display.
function prettyGenre(categories: string[] | undefined): string | null {
  const first = categories?.[0];
  if (!first) return null;
  const leaf = first.split('/').pop()?.trim();
  if (!leaf) return null;
  return leaf
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Fetch a single Google Books volume's metadata by id. Returns null on any
// failure so the card can fall back gracefully. Cached for a day since a
// volume's metadata is effectively static.
export async function getBookMeta(bookId: string): Promise<BookMeta | null> {
  const query = process.env.GOOGLE_BOOKS_API_KEY
    ? `?key=${process.env.GOOGLE_BOOKS_API_KEY}`
    : '';
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(
        bookId
      )}${query}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleBook;
    const info = data.volumeInfo;
    if (!info) return null;

    // Prefer Open Library's well-known cover; fall back to Google's thumbnail.
    const wellKnownCover = await getWellKnownCover(
      info.title,
      info.authors?.[0]
    );

    return {
      genre: prettyGenre(info.categories),
      pageCount: info.pageCount ?? null,
      publishedYear: info.publishedDate?.slice(0, 4) ?? null,
      averageRating: info.averageRating ?? null,
      cover: wellKnownCover ?? normalizeCover(info.imageLinks?.thumbnail),
    };
  } catch {
    return null;
  }
}
