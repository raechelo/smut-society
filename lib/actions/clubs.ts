'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { clubs, clubMembers, users } from '@/lib/schema';
import { and, count, eq, inArray } from 'drizzle-orm';

function requireAuth() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error('Unauthorized');
    return session.user.id;
  });
}

export type ClubRole = 'member' | 'admin';

export type MyClub = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  role: ClubRole;
  memberCount: number;
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

export type ClubDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdBy: string;
  members: ClubMember[];
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
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

  return memberships.map((m) => ({
    ...m,
    memberCount: countByClub.get(m.id) ?? 0,
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
    .where(eq(clubs.isPublic, true))
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

  return {
    id: club.id,
    name: club.name,
    description: club.description,
    isPublic: club.isPublic,
    createdBy: club.createdBy,
    members,
    memberCount: members.length,
    isMember,
    isAdmin,
  };
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
