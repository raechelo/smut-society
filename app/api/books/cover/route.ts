// Resolves the "canonical" cover for a book. The ISBN Google returns often
// points at an obscure edition (bundle, reprint, foreign printing) whose cover
// isn't the well-known one. Open Library's search groups editions under a work
// and exposes a representative `cover_i`, which is usually the familiar cover.
// We proxy the lookup here because openlibrary.org/search.json sends no CORS
// header, so the browser can't call it directly.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim();
  const author = searchParams.get('author')?.trim();

  if (!title) {
    return Response.json({ coverUrl: null });
  }

  const params = new URLSearchParams({
    title,
    limit: '1',
    fields: 'cover_i',
  });
  if (author) params.set('author', author);

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${params}`,
      // Cover art is stable — let the platform cache it for a day.
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return Response.json({ coverUrl: null });

    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    const coverUrl =
      typeof coverId === 'number'
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : null;

    return Response.json({ coverUrl });
  } catch {
    return Response.json({ coverUrl: null });
  }
}
