'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  clubs,
  clubMembers,
  clubNominations,
  favorites,
  nominationVotes,
  readingShelf,
} from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function requireAuth() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error('Unauthorized');
    return session.user.id;
  });
}

export async function toggleFavorite(bookId: string) {
  const userId = await requireAuth();

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)));
    return { favorited: false };
  }

  await db.insert(favorites).values({ userId, bookId });
  return { favorited: true };
}

export async function getUserFavoriteIds(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db
    .select({ bookId: favorites.bookId })
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));

  return rows.map((r) => r.bookId);
}

// Add/remove a book on the user's personal "currently reading" shelf.
export async function toggleShelf(book: {
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  bookAuthor?: string;
}) {
  const userId = await requireAuth();

  const existing = await db
    .select()
    .from(readingShelf)
    .where(
      and(eq(readingShelf.userId, userId), eq(readingShelf.bookId, book.bookId))
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(readingShelf)
      .where(
        and(
          eq(readingShelf.userId, userId),
          eq(readingShelf.bookId, book.bookId)
        )
      );
    revalidatePath('/home');
    return { onShelf: false };
  }

  await db.insert(readingShelf).values({
    userId,
    bookId: book.bookId,
    bookTitle: book.bookTitle,
    bookCover: book.bookCover ?? null,
    bookAuthor: book.bookAuthor ?? null,
  });
  revalidatePath('/home');
  return { onShelf: true };
}

export async function getUserShelfIds(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db
    .select({ bookId: readingShelf.bookId })
    .from(readingShelf)
    .where(eq(readingShelf.userId, session.user.id));
  return rows.map((r) => r.bookId);
}

export async function getUserClubs() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(eq(clubMembers.userId, session.user.id));
}

export async function nominateBook(
  clubId: string,
  book: {
    bookId: string;
    bookTitle: string;
    bookCover?: string;
    bookAuthor?: string;
  }
) {
  const userId = await requireAuth();

  await db
    .insert(clubNominations)
    .values({ clubId, nominatedBy: userId, ...book })
    .onConflictDoNothing();
}

export async function toggleNominationVote(nominationId: string) {
  const userId = await requireAuth();

  const existing = await db
    .select()
    .from(nominationVotes)
    .where(
      and(
        eq(nominationVotes.userId, userId),
        eq(nominationVotes.nominationId, nominationId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(nominationVotes)
      .where(
        and(
          eq(nominationVotes.userId, userId),
          eq(nominationVotes.nominationId, nominationId)
        )
      );
    return { voted: false };
  }

  await db.insert(nominationVotes).values({ userId, nominationId });
  return { voted: true };
}
