'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { bookReviews, readingProgress, readingShelf } from '@/lib/schema';
import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import { bookBySlug } from '@/lib/hardcover';

export type StatSlice = { label: string; value: number };

// How many named genre slices the donut shows before the rest collapse into
// "Other" — matched to the validated 3-hue categorical palette in genre-donut.
const TOP_GENRES = 3;

// The viewer's finished books: club reads marked finished + personal-shelf books
// completed (excluding dnf). Returns distinct Hardcover slugs. Shared by every
// stat so they all describe the same "books you've read" set.
async function finishedBookIds(userId: string): Promise<string[]> {
  const clubRows = await db
    .select({ bookId: readingProgress.bookId })
    .from(readingProgress)
    .where(
      and(eq(readingProgress.userId, userId), eq(readingProgress.finished, true))
    );

  const shelfRows = await db
    .select({ bookId: readingShelf.bookId })
    .from(readingShelf)
    .where(
      and(
        eq(readingShelf.userId, userId),
        isNotNull(readingShelf.finishedAt),
        ne(readingShelf.status, 'dnf')
      )
    );

  return [
    ...new Set(
      [...clubRows, ...shelfRows].map((r) => r.bookId).filter(Boolean)
    ),
  ];
}

// The genre breakdown of the viewer's finished books. Each book is counted once
// by its primary Hardcover genre; the top few genres are returned with
// everything else — and books with no genre — bucketed into "Other" (last).
export async function getGenreStats(): Promise<StatSlice[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const bookIds = await finishedBookIds(userId);
  if (bookIds.length === 0) return [];

  const OTHER = 'Other';
  const counts = new Map<string, number>();
  await Promise.all(
    bookIds.map(async (id) => {
      const meta = await bookBySlug(id);
      const genre = meta?.genres[0]?.trim() || OTHER;
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    })
  );

  // Rank genres by count, keep the top N as their own slices, fold the tail
  // (and any explicit "Other") into a single trailing Other slice.
  const ranked = [...counts.entries()]
    .filter(([label]) => label !== OTHER)
    .sort((a, b) => b[1] - a[1]);

  const top = ranked.slice(0, TOP_GENRES);
  const otherValue =
    (counts.get(OTHER) ?? 0) +
    ranked.slice(TOP_GENRES).reduce((sum, [, n]) => sum + n, 0);

  const slices: StatSlice[] = top.map(([label, value]) => ({ label, value }));
  if (otherValue > 0) slices.push({ label: OTHER, value: otherValue });
  return slices;
}

// The viewer's spice-rating distribution across their finished books: a length-5
// array where index i holds the number of read books they rated i+1 peppers.
// Books they finished but never gave a spice rating are simply not counted.
export async function getSpiceStats(): Promise<number[]> {
  const counts = [0, 0, 0, 0, 0];

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return counts;

  const bookIds = await finishedBookIds(userId);
  if (bookIds.length === 0) return counts;

  const rows = await db
    .select({ spice: bookReviews.spiceRating })
    .from(bookReviews)
    .where(
      and(
        eq(bookReviews.userId, userId),
        isNotNull(bookReviews.spiceRating),
        inArray(bookReviews.bookId, bookIds)
      )
    );

  for (const { spice } of rows) {
    if (spice && spice >= 1 && spice <= 5) counts[spice - 1] += 1;
  }
  return counts;
}

// Where the viewer's finished books came from — club reads vs. personal-shelf
// reads. A book finished inside a club counts as a club read even if it's also
// on the shelf (matching how the reading-shelf table de-dupes), so the two
// slices never double-count. Zero-value slices are dropped.
export async function getSourceStats(): Promise<StatSlice[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const clubRows = await db
    .select({ bookId: readingProgress.bookId })
    .from(readingProgress)
    .where(
      and(eq(readingProgress.userId, userId), eq(readingProgress.finished, true))
    );

  const shelfRows = await db
    .select({ bookId: readingShelf.bookId })
    .from(readingShelf)
    .where(
      and(
        eq(readingShelf.userId, userId),
        isNotNull(readingShelf.finishedAt),
        ne(readingShelf.status, 'dnf')
      )
    );

  const clubIds = new Set(clubRows.map((r) => r.bookId).filter(Boolean));
  const personalIds = new Set(shelfRows.map((r) => r.bookId).filter(Boolean));
  let personal = 0;
  for (const id of personalIds) if (!clubIds.has(id)) personal += 1;

  const slices: StatSlice[] = [];
  if (clubIds.size > 0)
    slices.push({ label: 'Book clubs', value: clubIds.size });
  if (personal > 0) slices.push({ label: 'Personal', value: personal });
  return slices;
}
