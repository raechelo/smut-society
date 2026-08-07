'use client';

import { useEffect, useState } from 'react';

type Props = {
  title: string;
  author?: string;
  isbn?: string;
  fallback?: string;
  alt: string;
  className?: string;
};

// `default=false` is essential on ISBN covers: without it Open Library serves a
// 1x1 blank placeholder (HTTP 200) for ISBNs it has no cover for, so <img>
// "succeeds", onError never fires, and the card shows a blank box instead of
// advancing the fallback chain. With it, a missing cover 404s and we move on.
function isbnCover(isbn?: string): string | null {
  return isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    : null;
}

// Cover-resolution chain, best match first:
//   1. Open Library work cover (canonical/well-known edition) — fetched async
//   2. Open Library cover by the specific ISBN Google returned
//   3. Google Books thumbnail
//   4. nothing → parent renders a text placeholder
// Each candidate that fails to load advances to the next via onError.
export function BookCoverImage({
  title,
  author,
  isbn,
  fallback,
  alt,
  className,
}: Props) {
  const staticCandidates = [isbnCover(isbn), fallback ?? null].filter(
    (c): c is string => !!c
  );

  const [candidates, setCandidates] = useState<string[]>(staticCandidates);
  const [index, setIndex] = useState(0);

  // Look up the canonical work cover and, if found, put it at the front.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ title });
    if (author) params.set('author', author);

    fetch(`/api/books/cover?${params}`)
      .then((r) => r.json())
      .then(({ coverUrl }: { coverUrl: string | null }) => {
        if (cancelled || !coverUrl) return;
        setCandidates((prev) =>
          prev[0] === coverUrl ? prev : [coverUrl, ...prev]
        );
        setIndex(0);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [title, author]);

  const src = candidates[index];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
