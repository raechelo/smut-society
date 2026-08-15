'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  bookReviews,
  clubs,
  clubMembers,
  notifications,
  readingGoals,
  readingProgress,
  readingShelf,
} from '@/lib/schema';
import { and, count, desc, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { bookBySlug } from '@/lib/hardcover';

function currentYear() {
  return new Date().getFullYear();
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type ReadingGoalInfo = {
  year: number;
  target: number;
  read: number;
};

export type ReadingItem = {
  key: string;
  bookId: string;
  title: string;
  author: string | null;
  cover: string | null;
  // Club name, or a personal-shelf label.
  subtitle: string;
  // Where clicking goes (the club page), or null for personal-shelf books.
  href: string | null;
  // The club this read belongs to, or null for a personal-shelf book. Drives
  // which "mark finished" action to run.
  clubId: string | null;
};

// The viewer's notifications, newest first.
export async function getNotifications(
  limit = 20
): Promise<AppNotification[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      link: notifications.link,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = await requireAuth();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  revalidatePath('/home');
}

// The viewer's goal for the current year plus how many books they've finished.
export async function getReadingGoal(): Promise<ReadingGoalInfo | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const year = currentYear();
  const [goal] = await db
    .select({ target: readingGoals.target })
    .from(readingGoals)
    .where(and(eq(readingGoals.userId, userId), eq(readingGoals.year, year)))
    .limit(1);
  if (!goal) return null;

  const read = await booksReadThisYear(userId, year);
  return { year, target: goal.target, read };
}

// Books the user marked finished this year — club reads plus personal-shelf
// books they've marked finished.
async function booksReadThisYear(userId: string, year: number) {
  const start = new Date(year, 0, 1);

  const [{ c: clubCount }] = await db
    .select({ c: count() })
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.finished, true),
        gte(readingProgress.updatedAt, start)
      )
    );

  const [{ c: shelfCount }] = await db
    .select({ c: count() })
    .from(readingShelf)
    .where(
      and(
        eq(readingShelf.userId, userId),
        isNotNull(readingShelf.finishedAt),
        gte(readingShelf.finishedAt, start)
      )
    );

  return Number(clubCount) + Number(shelfCount);
}

export async function setReadingGoal(target: number): Promise<void> {
  const userId = await requireAuth();
  const value = Math.max(1, Math.trunc(target) || 0);
  const year = currentYear();
  await db
    .insert(readingGoals)
    .values({ userId, year, target: value })
    .onConflictDoUpdate({
      target: [readingGoals.userId, readingGoals.year],
      set: { target: value },
    });
  revalidatePath('/home');
}

// Books the viewer is currently reading: every club they're in with an
// unfinished current book, plus their personal shelf. Club books come first;
// shelf books they've also got in a club are de-duplicated out.
export async function getCurrentlyReading(): Promise<ReadingItem[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const clubRows = await db
    .select({
      clubId: clubs.id,
      clubName: clubs.name,
      bookId: clubs.currentBookId,
      title: clubs.currentBookTitle,
      author: clubs.currentBookAuthor,
      cover: clubs.currentBookCover,
      finished: readingProgress.finished,
    })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .leftJoin(
      readingProgress,
      and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.clubId, clubs.id),
        eq(readingProgress.bookId, clubs.currentBookId)
      )
    )
    .where(and(eq(clubMembers.userId, userId), isNotNull(clubs.currentBookId)));

  const items: ReadingItem[] = [];
  const seen = new Set<string>();
  for (const r of clubRows) {
    if (r.finished === true || !r.bookId) continue;
    seen.add(r.bookId);
    items.push({
      key: `club-${r.clubId}-${r.bookId}`,
      bookId: r.bookId,
      title: r.title ?? 'Untitled',
      author: r.author,
      cover: r.cover,
      subtitle: r.clubName,
      href: `/bookclubs/${r.clubId}`,
      clubId: r.clubId,
    });
  }

  const shelfRows = await db
    .select({
      bookId: readingShelf.bookId,
      title: readingShelf.bookTitle,
      author: readingShelf.bookAuthor,
      cover: readingShelf.bookCover,
    })
    .from(readingShelf)
    .where(
      and(eq(readingShelf.userId, userId), isNull(readingShelf.finishedAt))
    )
    .orderBy(desc(readingShelf.createdAt));

  for (const r of shelfRows) {
    if (seen.has(r.bookId)) continue;
    seen.add(r.bookId);
    items.push({
      key: `shelf-${r.bookId}`,
      bookId: r.bookId,
      title: r.title,
      author: r.author,
      cover: r.cover,
      subtitle: 'On your shelf',
      href: null,
      clubId: null,
    });
  }

  return items;
}

// Mark a club read finished for the viewer only — updates their progress in the
// club (not the club's current book). Counts toward the reading goal via the
// finished flag, and drops off the currently-reading list.
export async function finishClubRead(
  clubId: string,
  bookId: string
): Promise<void> {
  const userId = await requireAuth();

  const [membership] = await db
    .select({ userId: clubMembers.userId })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership) throw new Error('You are not a member of this club');

  await db
    .insert(readingProgress)
    .values({
      userId,
      clubId,
      bookId,
      unit: 'chapter',
      value: 0,
      finished: true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        readingProgress.userId,
        readingProgress.clubId,
        readingProgress.bookId,
      ],
      set: { finished: true, updatedAt: new Date() },
    });

  revalidatePath('/home');
  revalidatePath(`/bookclubs/${clubId}`);
}

// Mark a personal-shelf book finished — it leaves the shelf but counts toward
// the reading goal for the year.
export async function finishShelfBook(bookId: string): Promise<void> {
  const userId = await requireAuth();
  await db
    .update(readingShelf)
    .set({ finishedAt: new Date() })
    .where(and(eq(readingShelf.userId, userId), eq(readingShelf.bookId, bookId)));
  revalidatePath('/home');
}

// ─── Past reads ────────────────────────────────────────────────────────────

export type ReadingGoalRow = {
  year: number;
  target: number;
  read: number;
  status: 'in progress' | 'completed';
};

// All of the viewer's yearly goals, newest first, with their finished-book
// count. A goal is completed once its target is met or its year has passed; we
// persist that transition so the stored status stays accurate for the tabs.
export async function getReadingGoals(): Promise<ReadingGoalRow[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const rows = await db
    .select({
      year: readingGoals.year,
      target: readingGoals.target,
      status: readingGoals.status,
    })
    .from(readingGoals)
    .where(eq(readingGoals.userId, userId))
    .orderBy(desc(readingGoals.year));

  const thisYear = currentYear();
  const result: ReadingGoalRow[] = [];
  for (const g of rows) {
    const read = await booksReadThisYear(userId, g.year);
    const status: ReadingGoalRow['status'] =
      read >= g.target || g.year < thisYear ? 'completed' : 'in progress';
    if (status !== g.status) {
      await db
        .update(readingGoals)
        .set({ status })
        .where(
          and(eq(readingGoals.userId, userId), eq(readingGoals.year, g.year))
        );
    }
    result.push({ year: g.year, target: g.target, read, status });
  }
  return result;
}

export type CompletedBook = {
  bookId: string;
  title: string;
  author: string | null;
  cover: string | null;
  userRating: number | null;
  overallRating: number | null;
  userSpice: number | null;
  // No per-club spice rating exists yet — always null (rendered as n/a).
  clubSpice: number | null;
  finishedAt: Date;
  clubName: string | null;
};

// Every book the viewer has marked finished — club reads (with the club name)
// and personal-shelf books (club = null → n/a) — joined to their own review and
// to Hardcover for cover/title/author + the overall rating. Newest first.
export async function getCompletedBooks(): Promise<CompletedBook[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const clubRows = await db
    .select({
      bookId: readingProgress.bookId,
      clubName: clubs.name,
      finishedAt: readingProgress.updatedAt,
    })
    .from(readingProgress)
    .innerJoin(clubs, eq(readingProgress.clubId, clubs.id))
    .where(
      and(eq(readingProgress.userId, userId), eq(readingProgress.finished, true))
    );

  const shelfRows = await db
    .select({
      bookId: readingShelf.bookId,
      title: readingShelf.bookTitle,
      author: readingShelf.bookAuthor,
      cover: readingShelf.bookCover,
      finishedAt: readingShelf.finishedAt,
    })
    .from(readingShelf)
    .where(
      and(eq(readingShelf.userId, userId), isNotNull(readingShelf.finishedAt))
    );

  const reviews = await db
    .select({
      bookId: bookReviews.bookId,
      rating: bookReviews.rating,
      spiceRating: bookReviews.spiceRating,
    })
    .from(bookReviews)
    .where(eq(bookReviews.userId, userId));
  const reviewByBook = new Map(reviews.map((r) => [r.bookId, r]));

  // Merge by book; a club read wins over a personal-shelf entry for the same
  // book (keeps the club name), but we borrow the shelf's denormalized fields
  // as a fallback if Hardcover can't resolve the slug.
  type Merged = {
    bookId: string;
    finishedAt: Date;
    clubName: string | null;
    title: string | null;
    author: string | null;
    cover: string | null;
  };
  const merged = new Map<string, Merged>();
  for (const r of clubRows) {
    if (!r.bookId) continue;
    const prev = merged.get(r.bookId);
    if (!prev || r.finishedAt > prev.finishedAt) {
      merged.set(r.bookId, {
        bookId: r.bookId,
        finishedAt: r.finishedAt,
        clubName: r.clubName,
        title: prev?.title ?? null,
        author: prev?.author ?? null,
        cover: prev?.cover ?? null,
      });
    }
  }
  for (const r of shelfRows) {
    if (!r.bookId || !r.finishedAt) continue;
    const prev = merged.get(r.bookId);
    if (!prev) {
      merged.set(r.bookId, {
        bookId: r.bookId,
        finishedAt: r.finishedAt,
        clubName: null,
        title: r.title,
        author: r.author,
        cover: r.cover,
      });
    } else {
      prev.title ??= r.title;
      prev.author ??= r.author;
      prev.cover ??= r.cover;
    }
  }

  const books = await Promise.all(
    [...merged.values()].map(async (e): Promise<CompletedBook> => {
      const meta = await bookBySlug(e.bookId);
      const review = reviewByBook.get(e.bookId);
      return {
        bookId: e.bookId,
        title: meta?.title ?? e.title ?? 'Untitled',
        author: meta?.authors[0] ?? e.author ?? null,
        cover: meta?.cover ?? e.cover ?? null,
        userRating: review?.rating ?? null,
        overallRating: meta?.rating ?? null,
        userSpice: review?.spiceRating ?? null,
        clubSpice: null,
        finishedAt: e.finishedAt,
        clubName: e.clubName,
      };
    })
  );

  books.sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime());
  return books;
}

// Save (or update) the viewer's rating + spice rating + review for a book,
// keyed by Hardcover slug. 0 means "not set" → stored as null.
export async function saveBookReview(
  bookId: string,
  rating: number,
  spiceRating: number,
  text?: string
): Promise<void> {
  const userId = await requireAuth();
  const clamp = (n: number) =>
    n ? Math.min(5, Math.max(1, Math.trunc(n))) : null;
  const reviewText = text?.trim() || null;
  const row = {
    rating: clamp(rating),
    spiceRating: clamp(spiceRating),
    reviewText,
  };
  await db
    .insert(bookReviews)
    .values({ userId, bookId, ...row })
    .onConflictDoUpdate({
      target: [bookReviews.userId, bookReviews.bookId],
      set: { ...row, updatedAt: new Date() },
    });
  revalidatePath('/past-reads');
}
