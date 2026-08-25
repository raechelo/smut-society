'use server';

import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { polls, pollOptions, pollVotes } from '@/lib/schema';
import { revalidatePath } from 'next/cache';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

// Trim, lowercase, dedupe, and cap the author's tags. (Mirrors quizzes.)
function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!tag || tag.length > MAX_TAG_LENGTH || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

// The create/edit poll form's payload. A poll is a single opinion-based
// question (its title) with a set of answer options.
export type CreatePollInput = {
  title: string;
  description: string | null;
  tags: string[];
  options: { text: string }[];
};

// Validate the form input and build the fully-id'd option rows. Ids are
// generated up front so the poll and its options can be inserted atomically in
// one batch (the neon-http driver can't read intermediate results
// mid-transaction). Shared by create and update.
function buildPollGraph(input: CreatePollInput) {
  const title = input.title.trim();
  if (!title) throw new Error('A poll question is required');
  const description = input.description?.trim() || null;

  const options = input.options.filter((o) => o.text.trim());
  // A poll needs at least two options to be a real choice.
  if (options.length < 2) throw new Error('Add at least two answer options');

  const optionValues = options.map((o, i) => ({
    id: randomUUID(),
    text: o.text.trim(),
    position: i,
  }));

  return {
    title,
    description,
    tags: normalizeTags(input.tags),
    optionValues,
  };
}

// Persist a new poll with its options.
export async function createPoll(
  input: CreatePollInput
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const graph = buildPollGraph(input);
  const pollId = randomUUID();

  await db.batch([
    db.insert(polls).values({
      id: pollId,
      title: graph.title,
      description: graph.description,
      tags: graph.tags,
      createdBy: session.user.id,
    }),
    db
      .insert(pollOptions)
      .values(graph.optionValues.map((o) => ({ ...o, pollId }))),
  ]);

  revalidatePath('/challenges/polls');
  return { id: pollId };
}

// Replace a poll's content in place. Owner-only. The options are rebuilt from
// scratch (delete + re-insert with fresh ids), so this discards existing votes
// for the poll — editing a poll people have answered resets its results.
export async function updatePoll(
  pollId: string,
  input: CreatePollInput
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [poll] = await db
    .select({ createdBy: polls.createdBy })
    .from(polls)
    .where(eq(polls.id, pollId))
    .limit(1);
  if (!poll) throw new Error('Poll not found');
  if (poll.createdBy !== session.user.id) {
    throw new Error('Only the poll owner can edit it');
  }

  const graph = buildPollGraph(input);

  await db.batch([
    db
      .update(polls)
      .set({
        title: graph.title,
        description: graph.description,
        tags: graph.tags,
      })
      .where(eq(polls.id, pollId)),
    // Deleting options cascades their votes away.
    db.delete(pollOptions).where(eq(pollOptions.pollId, pollId)),
    db
      .insert(pollOptions)
      .values(graph.optionValues.map((o) => ({ ...o, pollId }))),
  ]);

  revalidatePath(`/challenges/polls/${pollId}`);
  revalidatePath('/challenges/polls');
  return { id: pollId };
}

export type PollListItem = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  // The poll's creator — used to show owner-only edit/delete controls inline.
  createdBy: string;
  createdAt: Date;
  optionCount: number;
  // How many members have voted on this poll.
  voteCount: number;
};

type PollRow = Omit<PollListItem, 'optionCount' | 'voteCount'>;

// Attach option tallies and voter counts to a set of poll rows.
async function withCounts(rows: PollRow[]): Promise<PollListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [optionCounts, voteCounts] = await Promise.all([
    db
      .select({ pollId: pollOptions.pollId, n: count() })
      .from(pollOptions)
      .where(inArray(pollOptions.pollId, ids))
      .groupBy(pollOptions.pollId),
    db
      .select({ pollId: pollVotes.pollId, n: count() })
      .from(pollVotes)
      .where(inArray(pollVotes.pollId, ids))
      .groupBy(pollVotes.pollId),
  ]);

  const oByPoll = new Map(optionCounts.map((r) => [r.pollId, Number(r.n)]));
  const vByPoll = new Map(voteCounts.map((r) => [r.pollId, Number(r.n)]));

  return rows.map((r) => ({
    ...r,
    optionCount: oByPoll.get(r.id) ?? 0,
    voteCount: vByPoll.get(r.id) ?? 0,
  }));
}

const pollColumns = {
  id: polls.id,
  title: polls.title,
  description: polls.description,
  tags: polls.tags,
  createdBy: polls.createdBy,
  createdAt: polls.createdAt,
};

// All polls, newest first, with option/voter tallies for the cards.
export async function getPolls(): Promise<PollListItem[]> {
  const rows = await db
    .select(pollColumns)
    .from(polls)
    .orderBy(desc(polls.createdAt));
  return withCounts(rows);
}

// The signed-in user's own polls, newest first.
export async function getMyPolls(): Promise<PollListItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await db
    .select(pollColumns)
    .from(polls)
    .where(eq(polls.createdBy, session.user.id))
    .orderBy(desc(polls.createdAt));
  return withCounts(rows);
}

export type PollResults = {
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  // The option the signed-in user voted for, or null (also null when signed
  // out). Used to highlight their pick.
  myVote: string | null;
  signedIn: boolean;
};

// A poll's options with their live vote tallies plus the caller's own vote —
// fetched when a poll card expands, and returned again after casting a vote.
// Public: results are meant to be seen by everyone.
export async function getPollResults(pollId: string): Promise<PollResults> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [optionRows, voteRows] = await Promise.all([
    db
      .select({ id: pollOptions.id, text: pollOptions.text })
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(asc(pollOptions.position)),
    db
      .select({ optionId: pollVotes.optionId, n: count() })
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .groupBy(pollVotes.optionId),
  ]);

  const counts = new Map(voteRows.map((r) => [r.optionId, Number(r.n)]));
  let totalVotes = 0;
  for (const n of counts.values()) totalVotes += n;

  let myVote: string | null = null;
  if (userId) {
    const [mine] = await db
      .select({ optionId: pollVotes.optionId })
      .from(pollVotes)
      .where(and(eq(pollVotes.userId, userId), eq(pollVotes.pollId, pollId)))
      .limit(1);
    myVote = mine?.optionId ?? null;
  }

  return {
    options: optionRows.map((o) => ({ ...o, votes: counts.get(o.id) ?? 0 })),
    totalVotes,
    myVote,
    signedIn: !!userId,
  };
}

// Cast (or change) the signed-in user's vote on a poll, then return the updated
// results. One vote per user per poll — re-voting overwrites the previous pick.
export async function voteOnPoll(
  pollId: string,
  optionId: string
): Promise<PollResults> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Sign in to vote');
  const userId = session.user.id;

  // Ensure the chosen option actually belongs to this poll.
  const [option] = await db
    .select({ id: pollOptions.id })
    .from(pollOptions)
    .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)))
    .limit(1);
  if (!option) throw new Error('That option is not part of this poll');

  await db
    .insert(pollVotes)
    .values({ userId, pollId, optionId })
    .onConflictDoUpdate({
      target: [pollVotes.userId, pollVotes.pollId],
      set: { optionId, updatedAt: new Date() },
    });

  revalidatePath('/challenges/polls');
  return getPollResults(pollId);
}

// Remove the signed-in user's vote on a poll so they can vote again, then return
// the updated results.
export async function clearPollVote(pollId: string): Promise<PollResults> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Sign in to vote');

  await db
    .delete(pollVotes)
    .where(
      and(
        eq(pollVotes.userId, session.user.id),
        eq(pollVotes.pollId, pollId)
      )
    );

  revalidatePath('/challenges/polls');
  return getPollResults(pollId);
}

export type PollEditData = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  options: { id: string; text: string }[];
};

// The full editable poll, owner-only. Returns null for non-owners or a missing
// poll, so the edit page can render not-found.
export async function getPollForEdit(
  id: string
): Promise<PollEditData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [poll] = await db
    .select({
      id: polls.id,
      title: polls.title,
      description: polls.description,
      tags: polls.tags,
      createdBy: polls.createdBy,
    })
    .from(polls)
    .where(eq(polls.id, id))
    .limit(1);
  if (!poll || poll.createdBy !== session.user.id) return null;

  const options = await db
    .select({ id: pollOptions.id, text: pollOptions.text })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, id))
    .orderBy(asc(pollOptions.position));

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    tags: poll.tags,
    options,
  };
}

// Delete a poll. Owner-only; options and votes cascade off the poll's foreign
// keys.
export async function deletePoll(pollId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [poll] = await db
    .select({ createdBy: polls.createdBy })
    .from(polls)
    .where(eq(polls.id, pollId))
    .limit(1);
  if (!poll) throw new Error('Poll not found');
  if (poll.createdBy !== session.user.id) {
    throw new Error('Only the poll owner can delete it');
  }

  await db.delete(polls).where(eq(polls.id, pollId));

  revalidatePath('/challenges/polls');
  revalidatePath('/home');
}
