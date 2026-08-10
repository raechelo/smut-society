'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  clubs,
  clubMembers,
  clubNominations,
  clubFinishedBooks,
  clubEvents,
  eventRsvps,
  readingProgress,
  nominationVotes,
  users,
} from '@/lib/schema';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  sql,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function requireAuth() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error('Unauthorized');
    return session.user.id;
  });
}

// Resolve the signed-in user and assert they're an admin of the given club.
// Throws Unauthorized when signed out, or a caller-supplied message otherwise.
async function requireClubAdmin(clubId: string, message: string) {
  const userId = await requireAuth();
  const [membership] = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership || membership.role !== 'admin') throw new Error(message);
  return userId;
}

export type ClubRole = 'member' | 'admin';

export type MyClub = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  role: ClubRole;
  memberCount: number;
  upcomingEventCount: number;
};

export type PublicClub = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
};

export type ClubMember = {
  id: string;
  name: string | null;
  image: string | null;
  role: ClubRole;
};

export type ClubBook = {
  bookId: string;
  title: string;
  cover: string | null;
  author: string | null;
};

export type FinishedBook = ClubBook & {
  finishedAt: Date;
};

export type RsvpStatus = 'going' | 'not_going';

export type ProgressUnit = 'chapter' | 'page';

export type ReadingProgress = {
  unit: ProgressUnit;
  value: number;
  finished: boolean;
};

export type ClubEvent = {
  id: string;
  title: string;
  location: string | null;
  startsAt: Date;
  attendingCount: number;
  myRsvp: RsvpStatus | null;
};

export type ClubNomination = {
  id: string;
  bookId: string;
  title: string;
  cover: string | null;
  author: string | null;
  voteCount: number;
  hasVoted: boolean;
};

export type ClubDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdBy: string;
  // Whether the viewer created the club (the owner). Owners are always admins.
  isOwner: boolean;
  // Set when the club is archived; null when active.
  archivedAt: Date | null;
  members: ClubMember[];
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
  currentBook: ClubBook | null;
  // The viewer's own progress on the current book (null if none yet).
  myProgress: ReadingProgress | null;
  nominations: ClubNomination[];
  finishedBooks: FinishedBook[];
  // Soonest-first, capped at two; the club page shows the next one prominently
  // and the one after it as a follow-up. upcomingEventCount is the full count
  // so the card can render a "+N more".
  upcomingEvents: ClubEvent[];
  upcomingEventCount: number;
};

// Clubs the signed-in user belongs to, with a member count per club.
export async function getMyClubs(): Promise<MyClub[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  const memberships = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      description: clubs.description,
      isPublic: clubs.isPublic,
      role: clubMembers.role,
    })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(eq(clubMembers.userId, userId));

  if (memberships.length === 0) return [];

  const counts = await db
    .select({ clubId: clubMembers.clubId, memberCount: count() })
    .from(clubMembers)
    .where(
      inArray(
        clubMembers.clubId,
        memberships.map((m) => m.id)
      )
    )
    .groupBy(clubMembers.clubId);

  const countByClub = new Map(counts.map((c) => [c.clubId, c.memberCount]));

  // Upcoming (not-yet-started) event counts per club.
  const eventCounts = await db
    .select({ clubId: clubEvents.clubId, upcoming: count() })
    .from(clubEvents)
    .where(
      and(
        inArray(
          clubEvents.clubId,
          memberships.map((m) => m.id)
        ),
        gte(clubEvents.startsAt, new Date())
      )
    )
    .groupBy(clubEvents.clubId);

  const eventsByClub = new Map(eventCounts.map((e) => [e.clubId, e.upcoming]));

  return memberships.map((m) => ({
    ...m,
    memberCount: countByClub.get(m.id) ?? 0,
    upcomingEventCount: eventsByClub.get(m.id) ?? 0,
  }));
}

// All public clubs, flagged with whether the current user has already joined.
export async function getPublicClubs(): Promise<PublicClub[]> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      description: clubs.description,
      memberCount: count(clubMembers.userId),
    })
    .from(clubs)
    .leftJoin(clubMembers, eq(clubMembers.clubId, clubs.id))
    .where(and(eq(clubs.isPublic, true), isNull(clubs.archivedAt)))
    .groupBy(clubs.id);

  let myClubIds = new Set<string>();
  if (userId) {
    const mine = await db
      .select({ clubId: clubMembers.clubId })
      .from(clubMembers)
      .where(eq(clubMembers.userId, userId));
    myClubIds = new Set(mine.map((m) => m.clubId));
  }

  return rows.map((r) => ({ ...r, isMember: myClubIds.has(r.id) }));
}

// Full club detail. Returns null when the club doesn't exist, or when it's
// private and the viewer isn't a member (so the page renders not-found).
export async function getClub(clubId: string): Promise<ClubDetail | null> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [club] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) return null;

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      role: clubMembers.role,
    })
    .from(clubMembers)
    .innerJoin(users, eq(clubMembers.userId, users.id))
    .where(eq(clubMembers.clubId, clubId));

  const isMember = !!userId && members.some((m) => m.id === userId);
  if (!club.isPublic && !isMember) return null;

  const isAdmin =
    !!userId && members.some((m) => m.id === userId && m.role === 'admin');

  // Nominations for the next read, with vote tallies and whether the viewer
  // has voted. Ordered by votes (then newest) so the front-runner is first.
  const nominationRows = await db
    .select({
      id: clubNominations.id,
      bookId: clubNominations.bookId,
      title: clubNominations.bookTitle,
      cover: clubNominations.bookCover,
      author: clubNominations.bookAuthor,
      createdAt: clubNominations.createdAt,
      voteCount: count(nominationVotes.userId),
      hasVoted: userId
        ? sql<boolean>`bool_or(${nominationVotes.userId} = ${userId})`
        : sql<boolean>`false`,
    })
    .from(clubNominations)
    .leftJoin(
      nominationVotes,
      eq(nominationVotes.nominationId, clubNominations.id)
    )
    .where(eq(clubNominations.clubId, clubId))
    .groupBy(clubNominations.id)
    .orderBy(desc(count(nominationVotes.userId)), desc(clubNominations.createdAt));

  // Reading history, newest first.
  const finishedRows = await db
    .select({
      bookId: clubFinishedBooks.bookId,
      title: clubFinishedBooks.bookTitle,
      cover: clubFinishedBooks.bookCover,
      author: clubFinishedBooks.bookAuthor,
      finishedAt: clubFinishedBooks.finishedAt,
    })
    .from(clubFinishedBooks)
    .where(eq(clubFinishedBooks.clubId, clubId))
    .orderBy(desc(clubFinishedBooks.finishedAt));

  // The next couple of events that haven't started yet, soonest first.
  const upcomingRows = await db
    .select({
      id: clubEvents.id,
      title: clubEvents.title,
      location: clubEvents.location,
      startsAt: clubEvents.startsAt,
    })
    .from(clubEvents)
    .where(and(eq(clubEvents.clubId, clubId), gte(clubEvents.startsAt, new Date())))
    .orderBy(asc(clubEvents.startsAt))
    .limit(2);

  // Attending tallies and the viewer's own RSVP for those events.
  let upcomingEvents: ClubEvent[] = [];
  if (upcomingRows.length > 0) {
    const eventIds = upcomingRows.map((e) => e.id);

    const attendance = await db
      .select({ eventId: eventRsvps.eventId, going: count() })
      .from(eventRsvps)
      .where(
        and(
          inArray(eventRsvps.eventId, eventIds),
          eq(eventRsvps.status, 'going')
        )
      )
      .groupBy(eventRsvps.eventId);
    const goingByEvent = new Map(attendance.map((a) => [a.eventId, a.going]));

    const myRsvpByEvent = new Map<string, RsvpStatus>();
    if (userId) {
      const mine = await db
        .select({ eventId: eventRsvps.eventId, status: eventRsvps.status })
        .from(eventRsvps)
        .where(
          and(
            inArray(eventRsvps.eventId, eventIds),
            eq(eventRsvps.userId, userId)
          )
        );
      for (const r of mine) myRsvpByEvent.set(r.eventId, r.status);
    }

    upcomingEvents = upcomingRows.map((e) => ({
      ...e,
      attendingCount: Number(goingByEvent.get(e.id) ?? 0),
      myRsvp: myRsvpByEvent.get(e.id) ?? null,
    }));
  }

  const [{ upcomingEventCount }] = await db
    .select({ upcomingEventCount: count() })
    .from(clubEvents)
    .where(
      and(eq(clubEvents.clubId, clubId), gte(clubEvents.startsAt, new Date()))
    );

  const currentBook: ClubBook | null = club.currentBookId
    ? {
        bookId: club.currentBookId,
        title: club.currentBookTitle ?? 'Untitled',
        cover: club.currentBookCover,
        author: club.currentBookAuthor,
      }
    : null;

  // The viewer's progress on the current book, if any.
  let myProgress: ReadingProgress | null = null;
  if (userId && currentBook) {
    const [row] = await db
      .select({
        unit: readingProgress.unit,
        value: readingProgress.value,
        finished: readingProgress.finished,
      })
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.clubId, clubId),
          eq(readingProgress.bookId, currentBook.bookId)
        )
      )
      .limit(1);
    if (row) myProgress = row;
  }

  return {
    id: club.id,
    name: club.name,
    description: club.description,
    isPublic: club.isPublic,
    createdBy: club.createdBy,
    isOwner: club.createdBy === userId,
    archivedAt: club.archivedAt,
    members,
    memberCount: members.length,
    isMember,
    isAdmin,
    currentBook,
    myProgress,
    nominations: nominationRows.map((n) => ({
      id: n.id,
      bookId: n.bookId,
      title: n.title,
      cover: n.cover,
      author: n.author,
      voteCount: Number(n.voteCount),
      hasVoted: Boolean(n.hasVoted),
    })),
    finishedBooks: finishedRows,
    upcomingEvents,
    upcomingEventCount,
  };
}

// Schedule an event for the club. Admin-only. startsAt must be in the future.
export async function scheduleEvent(
  clubId: string,
  input: { title: string; location?: string; startsAt: Date }
): Promise<void> {
  const userId = await requireAuth();

  const [membership] = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can schedule events');
  }

  const title = input.title.trim();
  if (!title) throw new Error('An event title is required');
  if (Number.isNaN(input.startsAt.getTime())) {
    throw new Error('Pick a valid date and time');
  }
  if (input.startsAt.getTime() <= Date.now()) {
    throw new Error('The event must be in the future');
  }

  await db.insert(clubEvents).values({
    clubId,
    title,
    location: input.location?.trim() || null,
    startsAt: input.startsAt,
    createdBy: userId,
  });

  revalidatePath(`/bookclubs/${clubId}`);
}

// Set (or clear, with null) the viewer's RSVP to an event. Members only.
export async function setEventRsvp(
  eventId: string,
  status: RsvpStatus | null
): Promise<void> {
  const userId = await requireAuth();

  const [event] = await db
    .select({ clubId: clubEvents.clubId })
    .from(clubEvents)
    .where(eq(clubEvents.id, eventId))
    .limit(1);
  if (!event) throw new Error('Event not found');

  const [membership] = await db
    .select({ userId: clubMembers.userId })
    .from(clubMembers)
    .where(
      and(eq(clubMembers.clubId, event.clubId), eq(clubMembers.userId, userId))
    )
    .limit(1);
  if (!membership) throw new Error('Join this club to RSVP');

  if (status === null) {
    await db
      .delete(eventRsvps)
      .where(
        and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId))
      );
  } else {
    await db
      .insert(eventRsvps)
      .values({ eventId, userId, status })
      .onConflictDoUpdate({
        target: [eventRsvps.eventId, eventRsvps.userId],
        set: { status },
      });
  }

  revalidatePath(`/bookclubs/${event.clubId}`);
}

// Upsert the viewer's reading progress on a club book. Members only.
// A finished flag overrides the numeric value.
export async function updateProgress(
  clubId: string,
  bookId: string,
  input: { unit: ProgressUnit; value: number; finished: boolean }
): Promise<void> {
  const userId = await requireAuth();

  const [membership] = await db
    .select({ userId: clubMembers.userId })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership) throw new Error('Join this club to track progress');

  const value = Math.max(0, Math.trunc(input.value) || 0);

  await db
    .insert(readingProgress)
    .values({
      userId,
      clubId,
      bookId,
      unit: input.unit,
      value,
      finished: input.finished,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        readingProgress.userId,
        readingProgress.clubId,
        readingProgress.bookId,
      ],
      set: {
        unit: input.unit,
        value,
        finished: input.finished,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/bookclubs/${clubId}`);
}

// Mark the club's current book as finished: record it in the reading history
// and clear the current slot so the club can pick its next read. Admin-only.
export async function finishCurrentBook(clubId: string): Promise<void> {
  const userId = await requireAuth();

  const [membership] = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can mark a book as finished');
  }

  const [club] = await db
    .select()
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club?.currentBookId) throw new Error('There is no current book');

  await db.insert(clubFinishedBooks).values({
    clubId,
    bookId: club.currentBookId,
    bookTitle: club.currentBookTitle ?? 'Untitled',
    bookCover: club.currentBookCover,
    bookAuthor: club.currentBookAuthor,
  });

  await db
    .update(clubs)
    .set({
      currentBookId: null,
      currentBookTitle: null,
      currentBookCover: null,
      currentBookAuthor: null,
      currentBookSetAt: null,
    })
    .where(eq(clubs.id, clubId));

  revalidatePath(`/bookclubs/${clubId}`);
}

// Promote a nomination to the club's current read. Admin-only. Clears the
// nomination from the pool (its votes cascade) once it becomes the current book.
export async function setCurrentBook(
  clubId: string,
  nominationId: string
): Promise<void> {
  const userId = await requireAuth();

  const [membership] = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can pick the next book');
  }

  const [nomination] = await db
    .select()
    .from(clubNominations)
    .where(
      and(
        eq(clubNominations.id, nominationId),
        eq(clubNominations.clubId, clubId)
      )
    )
    .limit(1);
  if (!nomination) throw new Error('Nomination not found');

  await db
    .update(clubs)
    .set({
      currentBookId: nomination.bookId,
      currentBookTitle: nomination.bookTitle,
      currentBookCover: nomination.bookCover,
      currentBookAuthor: nomination.bookAuthor,
      currentBookSetAt: new Date(),
    })
    .where(eq(clubs.id, clubId));

  await db
    .delete(clubNominations)
    .where(eq(clubNominations.id, nominationId));

  revalidatePath(`/bookclubs/${clubId}`);
}

// Create a club and add the creator as its first admin member.
export async function createClub(input: {
  name: string;
  description?: string;
  isPublic: boolean;
}): Promise<{ id: string }> {
  const userId = await requireAuth();

  const name = input.name.trim();
  if (!name) throw new Error('A club name is required');
  const description = input.description?.trim() || null;

  const [club] = await db
    .insert(clubs)
    .values({ name, description, isPublic: input.isPublic, createdBy: userId })
    .returning({ id: clubs.id });

  await db
    .insert(clubMembers)
    .values({ clubId: club.id, userId, role: 'admin' });

  return { id: club.id };
}

// Join a public club. Private clubs can't be joined without an invite (later).
export async function joinClub(clubId: string): Promise<void> {
  const userId = await requireAuth();

  const [club] = await db
    .select({ isPublic: clubs.isPublic })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) throw new Error('Club not found');
  if (!club.isPublic) throw new Error('This club is private');

  await db
    .insert(clubMembers)
    .values({ clubId, userId })
    .onConflictDoNothing();
}

export async function leaveClub(clubId: string): Promise<void> {
  const userId = await requireAuth();
  await db
    .delete(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)));
}

// Promote a fellow club member to admin. Admin-only, and a no-op guard rejects
// promoting someone who is already an admin.
export async function promoteMemberToAdmin(
  clubId: string,
  memberUserId: string
): Promise<void> {
  await requireClubAdmin(clubId, 'Only admins can change member roles');

  const [member] = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, memberUserId)
      )
    )
    .limit(1);
  if (!member) throw new Error('That person is not a member of this club');
  if (member.role === 'admin') throw new Error('They are already an admin');

  await db
    .update(clubMembers)
    .set({ role: 'admin' })
    .where(
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, memberUserId)
      )
    );

  revalidatePath(`/bookclubs/${clubId}`);
}

// Rename a club. Admin-only.
export async function renameClub(clubId: string, name: string): Promise<void> {
  await requireClubAdmin(clubId, 'Only admins can rename the club');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('A club name is required');

  await db.update(clubs).set({ name: trimmed }).where(eq(clubs.id, clubId));

  revalidatePath(`/bookclubs/${clubId}`);
  revalidatePath('/bookclubs');
}

// Archive a club: hide it from Explore and mark it inactive. Admin-only.
export async function archiveClub(clubId: string): Promise<void> {
  await requireClubAdmin(clubId, 'Only admins can archive the club');

  await db
    .update(clubs)
    .set({ archivedAt: new Date() })
    .where(eq(clubs.id, clubId));

  revalidatePath(`/bookclubs/${clubId}`);
  revalidatePath('/bookclubs');
}

// Restore an archived club back to active. Admin-only.
export async function unarchiveClub(clubId: string): Promise<void> {
  await requireClubAdmin(clubId, 'Only admins can restore the club');

  await db.update(clubs).set({ archivedAt: null }).where(eq(clubs.id, clubId));

  revalidatePath(`/bookclubs/${clubId}`);
  revalidatePath('/bookclubs');
}

// Permanently delete a club. Owner-only (the member who created it). Members,
// nominations, events, RSVPs, reading progress, and finished books all cascade
// off the club's foreign keys.
export async function deleteClub(clubId: string): Promise<void> {
  const userId = await requireAuth();

  const [club] = await db
    .select({ createdBy: clubs.createdBy })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) throw new Error('Club not found');
  if (club.createdBy !== userId) {
    throw new Error('Only the club owner can delete the club');
  }

  await db.delete(clubs).where(eq(clubs.id, clubId));

  revalidatePath('/bookclubs');
}
