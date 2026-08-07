import { isEnglishBook, isRelevantBook, type GoogleBook } from '@/lib/types/books';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const orderBy = searchParams.get('orderBy') ?? 'relevance';

  if (!q?.trim()) {
    return Response.json({ items: [] });
  }

  // NB: no langRestrict=en — it's unreliable and can drop a query to zero
  // results (e.g. "twisted love" returns 0 with it, 17 English editions
  // without). English filtering is done per-volume below (see isEnglishBook).
  const params = new URLSearchParams({
    q,
    maxResults: '20',
    printType: 'books',
    orderBy,
    ...(process.env.GOOGLE_BOOKS_API_KEY
      ? { key: process.env.GOOGLE_BOOKS_API_KEY }
      : {}),
  });

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params}`
  );

  const data = await res.json();

  if (!res.ok) {
    return Response.json(
      { items: [], error: data.error?.message ?? 'Google Books request failed' },
      { status: res.status }
    );
  }

  return Response.json({
    items: (data.items ?? []).filter(
      (book: GoogleBook) => isRelevantBook(book) && isEnglishBook(book)
    ),
  });
}
