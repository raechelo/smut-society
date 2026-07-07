'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  clubs,
  clubMembers,
  clubNominations,
  favorites,
  nominationVotes,
} from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

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
