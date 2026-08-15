import { searchBooks, popularBooks } from '@/lib/hardcover';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const perPage = Number(searchParams.get('per') ?? '12') || 12;

  // No query → the default "Popular books" grid (by reader count).
  const items = q.trim()
    ? (await searchBooks(q, page, perPage)).items
    : await popularBooks(page, perPage);

  // A full page implies there's likely a next one.
  return Response.json({ items, hasMore: items.length === perPage });
}
