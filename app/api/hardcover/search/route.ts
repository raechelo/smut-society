import { searchBooks } from '@/lib/hardcover';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json({ items: [] });

  const items = await searchBooks(q, 24);
  return Response.json({ items });
}
