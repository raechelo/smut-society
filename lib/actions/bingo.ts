'use server';

import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  bingoCards,
  bingoCardShares,
  clubMembers,
  users,
} from '@/lib/schema';
import { revalidatePath } from 'next/cache';

const CELLS = 25;
const MAX_CELL_LEN = 280;
const MAX_TITLE_LEN = 120;

export type BingoCell = { text: string; marked: boolean };

const emptyCells = (): BingoCell[] =>
  Array.from({ length: CELLS }, () => ({ text: '', marked: false }));

// Coerce arbitrary stored/submitted data into exactly 25 well-formed cells.
function normalizeCells(input: unknown): BingoCell[] {
  const arr = Array.isArray(input) ? input : [];
  return Array.from({ length: CELLS }, (_, i) => {
    const c = arr[i] as { text?: unknown; marked?: unknown } | undefined;
    return {
      text: typeof c?.text === 'string' ? c.text.slice(0, MAX_CELL_LEN) : '',
      marked: !!c?.marked,
    };
  });
}

export type BingoCardData = {
  id: string;
  title: string;
  cells: BingoCell[];
  locked: boolean;
};

// Create a blank card for the signed-in user and return its id (the caller
// redirects to the editor).
export async function createBingoCard(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const id = randomUUID();
  await db.insert(bingoCards).values({
    id,
    userId: session.user.id,
    title: '',
    cells: emptyCells(),
  });
  revalidatePath('/challenges/bingo');
  return { id };
}

export type BingoCardListItem = {
  id: string;
  title: string;
  cells: BingoCell[];
  locked: boolean;
  markedCount: number;
  filledCount: number;
  updatedAt: Date;
};

// The signed-in user's bingo cards, most-recently-updated first.
export async function getMyBingoCards(): Promise<BingoCardListItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await db
    .select({
      id: bingoCards.id,
      title: bingoCards.title,
      cells: bingoCards.cells,
      locked: bingoCards.locked,
      updatedAt: bingoCards.updatedAt,
    })
    .from(bingoCards)
    .where(eq(bingoCards.userId, session.user.id))
    .orderBy(desc(bingoCards.updatedAt));

  return rows.map((r) => {
    const cells = normalizeCells(r.cells);
    return {
      id: r.id,
      title: r.title,
      cells,
      locked: r.locked,
      markedCount: cells.filter((c) => c.marked).length,
      filledCount: cells.filter((c) => c.text.trim()).length,
      updatedAt: r.updatedAt,
    };
  });
}

// One card, owner-only. Returns null for a missing card or non-owner so the
// editor page can render not-found.
export async function getBingoCard(id: string): Promise<BingoCardData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [row] = await db
    .select({
      id: bingoCards.id,
      title: bingoCards.title,
      cells: bingoCards.cells,
      locked: bingoCards.locked,
      userId: bingoCards.userId,
    })
    .from(bingoCards)
    .where(eq(bingoCards.id, id))
    .limit(1);
  if (!row || row.userId !== session.user.id) return null;
  return {
    id: row.id,
    title: row.title,
    cells: normalizeCells(row.cells),
    locked: row.locked,
  };
}

// Persist a card's title + cells (text and marks). Owner-only; called debounced
// as the user edits or daubs squares. The lock is enforced here, not just in
// the UI: a locked card ignores incoming title/text and only applies the marks,
// while an unlocked card can't set any marks yet (marking is a post-lock
// activity). This makes cheating via the API impossible either way.
export async function saveBingoCard(
  id: string,
  input: { title: string; cells: BingoCell[] }
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [current] = await db
    .select({
      title: bingoCards.title,
      cells: bingoCards.cells,
      locked: bingoCards.locked,
    })
    .from(bingoCards)
    .where(and(eq(bingoCards.id, id), eq(bingoCards.userId, session.user.id)))
    .limit(1);
  if (!current) throw new Error('Card not found');

  const incoming = normalizeCells(input.cells);
  let title: string;
  let cells: BingoCell[];
  if (current.locked) {
    // Frozen predictions: keep stored text/title, apply only the new marks.
    const stored = normalizeCells(current.cells);
    title = current.title;
    cells = stored.map((c, i) => ({ text: c.text, marked: incoming[i].marked }));
  } else {
    // Still editing: accept text/title, but marks stay off until locked.
    title = (input.title ?? '').slice(0, MAX_TITLE_LEN);
    cells = incoming.map((c) => ({ text: c.text, marked: false }));
  }

  await db
    .update(bingoCards)
    .set({ title, cells, updatedAt: new Date() })
    .where(and(eq(bingoCards.id, id), eq(bingoCards.userId, session.user.id)));

  revalidatePath('/challenges/bingo');
}

// Lock a card ("Done editing"): freezes its predictions so only marks can
// change afterward. One-way and owner-only.
export async function lockBingoCard(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const res = await db
    .update(bingoCards)
    .set({ locked: true, updatedAt: new Date() })
    .where(and(eq(bingoCards.id, id), eq(bingoCards.userId, session.user.id)))
    .returning({ id: bingoCards.id });
  if (res.length === 0) throw new Error('Card not found');
  revalidatePath('/challenges/bingo');
}

// Share one of the user's cards into the given clubs. Owner-only, and limited
// to clubs the user actually belongs to. Idempotent per (card, club).
export async function shareBingoCardToClubs(
  cardId: string,
  clubIds: string[]
): Promise<{ shared: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;
  if (clubIds.length === 0) return { shared: 0 };

  const [card] = await db
    .select({ id: bingoCards.id })
    .from(bingoCards)
    .where(and(eq(bingoCards.id, cardId), eq(bingoCards.userId, userId)))
    .limit(1);
  if (!card) throw new Error('Card not found');

  // Only allow sharing into clubs the user is a member of.
  const memberships = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.userId, userId),
        inArray(clubMembers.clubId, clubIds)
      )
    );
  const allowed = memberships.map((m) => m.clubId);
  if (allowed.length === 0) {
    throw new Error('You are not a member of those clubs');
  }

  await db
    .insert(bingoCardShares)
    .values(allowed.map((clubId) => ({ cardId, clubId, sharedBy: userId })))
    .onConflictDoNothing();

  for (const clubId of allowed) {
    revalidatePath(`/bookclubs/${clubId}`);
    revalidatePath(`/bookclubs/${clubId}/challenges`);
  }
  return { shared: allowed.length };
}

export type SharedBingoCard = {
  cardId: string;
  title: string;
  cells: BingoCell[];
  ownerName: string | null;
  locked: boolean;
  markedCount: number;
  filledCount: number;
  sharedAt: Date;
};

// Bingo cards shared into a club, newest first. Public to the club page (no
// membership gate here — the club page controls who can view it).
export async function getClubSharedBingoCards(
  clubId: string,
  limit?: number
): Promise<SharedBingoCard[]> {
  const base = db
    .select({
      cardId: bingoCards.id,
      title: bingoCards.title,
      cells: bingoCards.cells,
      locked: bingoCards.locked,
      ownerName: users.name,
      sharedAt: bingoCardShares.createdAt,
    })
    .from(bingoCardShares)
    .innerJoin(bingoCards, eq(bingoCardShares.cardId, bingoCards.id))
    .innerJoin(users, eq(bingoCards.userId, users.id))
    .where(eq(bingoCardShares.clubId, clubId))
    .orderBy(desc(bingoCardShares.createdAt));

  const rows = limit ? await base.limit(limit) : await base;

  return rows.map((r) => {
    const cells = normalizeCells(r.cells);
    return {
      cardId: r.cardId,
      title: r.title,
      cells,
      ownerName: r.ownerName,
      locked: r.locked,
      markedCount: cells.filter((c) => c.marked).length,
      filledCount: cells.filter((c) => c.text.trim()).length,
      sharedAt: r.sharedAt,
    };
  });
}

// Delete a card. Owner-only.
export async function deleteBingoCard(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await db
    .delete(bingoCards)
    .where(and(eq(bingoCards.id, id), eq(bingoCards.userId, session.user.id)));
  revalidatePath('/challenges/bingo');
}
