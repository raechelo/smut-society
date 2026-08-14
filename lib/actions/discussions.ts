'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  clubThreads,
  clubThreadComments,
  clubMembers,
  threadReactions,
  commentReactions,
  users,
} from '@/lib/schema';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createNotifications } from '@/lib/notifications';

function requireAuth() {
  return auth().then((session) => {
    if (!session?.user?.id) throw new Error('Unauthorized');
    return session.user.id;
  });
}

async function requireClubMember(clubId: string, userId: string) {
  const [membership] = await db
    .select({ userId: clubMembers.userId })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1);
  if (!membership) throw new Error('Join this club to post');
}

export type ThreadSummary = {
  id: string;
  title: string;
  authorName: string | null;
  authorImage: string | null;
  commentCount: number;
  createdAt: Date;
};

// An emoji tally on a thread or comment: the emoji, how many reacted, and
// whether the viewer is one of them.
export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type ThreadComment = {
  id: string;
  body: string;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
  reactions: ReactionSummary[];
};

export type ThreadDetail = ThreadSummary & {
  body: string | null;
  comments: ThreadComment[];
  reactions: ReactionSummary[];
};

// Threads for a club, newest first, with author and reply count. Pass a limit
// for the club-page preview.
export async function getThreads(
  clubId: string,
  limit?: number
): Promise<ThreadSummary[]> {
  const q = db
    .select({
      id: clubThreads.id,
      title: clubThreads.title,
      authorName: users.name,
      authorImage: users.image,
      createdAt: clubThreads.createdAt,
      commentCount: count(clubThreadComments.id),
    })
    .from(clubThreads)
    .innerJoin(users, eq(clubThreads.createdBy, users.id))
    .leftJoin(
      clubThreadComments,
      eq(clubThreadComments.threadId, clubThreads.id)
    )
    .where(eq(clubThreads.clubId, clubId))
    .groupBy(clubThreads.id, users.name, users.image)
    .orderBy(desc(clubThreads.createdAt));

  const rows = await (limit ? q.limit(limit) : q);
  return rows.map((r) => ({ ...r, commentCount: Number(r.commentCount) }));
}

// All threads for a club, each with its full comment list and emoji reactions.
// Powers the single discussion feed (newest thread first; comments oldest-first).
export async function getThreadsWithComments(
  clubId: string
): Promise<ThreadDetail[]> {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const threads = await db
    .select({
      id: clubThreads.id,
      title: clubThreads.title,
      body: clubThreads.body,
      authorName: users.name,
      authorImage: users.image,
      createdAt: clubThreads.createdAt,
    })
    .from(clubThreads)
    .innerJoin(users, eq(clubThreads.createdBy, users.id))
    .where(eq(clubThreads.clubId, clubId))
    .orderBy(desc(clubThreads.createdAt));

  if (threads.length === 0) return [];
  const threadIds = threads.map((t) => t.id);

  const rows = await db
    .select({
      threadId: clubThreadComments.threadId,
      id: clubThreadComments.id,
      body: clubThreadComments.body,
      authorName: users.name,
      authorImage: users.image,
      createdAt: clubThreadComments.createdAt,
    })
    .from(clubThreadComments)
    .innerJoin(users, eq(clubThreadComments.createdBy, users.id))
    .where(inArray(clubThreadComments.threadId, threadIds))
    .orderBy(asc(clubThreadComments.createdAt));

  const commentIds = rows.map((r) => r.id);

  // Reaction tallies for both threads and comments, keyed by target id.
  const threadReactionsByTarget = await reactionMap(
    threadReactions,
    threadReactions.threadId,
    threadIds,
    viewerId
  );
  const commentReactionsByTarget = await reactionMap(
    commentReactions,
    commentReactions.commentId,
    commentIds,
    viewerId
  );

  const byThread = new Map<string, ThreadComment[]>();
  for (const { threadId, ...comment } of rows) {
    const list = byThread.get(threadId) ?? [];
    list.push({
      ...comment,
      reactions: commentReactionsByTarget.get(comment.id) ?? [],
    });
    byThread.set(threadId, list);
  }

  return threads.map((t) => {
    const comments = byThread.get(t.id) ?? [];
    return {
      ...t,
      commentCount: comments.length,
      comments,
      reactions: threadReactionsByTarget.get(t.id) ?? [],
    };
  });
}

// Aggregates a reactions table into emoji tallies per target id (most-used
// first), flagging which the viewer has reacted with.
async function reactionMap(
  table: typeof threadReactions | typeof commentReactions,
  targetColumn: typeof threadReactions.threadId | typeof commentReactions.commentId,
  targetIds: string[],
  viewerId: string | null
): Promise<Map<string, ReactionSummary[]>> {
  const result = new Map<string, ReactionSummary[]>();
  if (targetIds.length === 0) return result;

  const rows = await db
    .select({
      targetId: targetColumn,
      emoji: table.emoji,
      count: count(),
      reacted: viewerId
        ? sql<boolean>`bool_or(${table.userId} = ${viewerId})`
        : sql<boolean>`false`,
    })
    .from(table)
    .where(inArray(targetColumn, targetIds))
    .groupBy(targetColumn, table.emoji)
    .orderBy(desc(count()));

  for (const r of rows) {
    const list = result.get(r.targetId) ?? [];
    list.push({
      emoji: r.emoji,
      count: Number(r.count),
      reacted: Boolean(r.reacted),
    });
    result.set(r.targetId, list);
  }
  return result;
}

// Start a new thread. Members only. Returns the new thread id.
export async function createThread(
  clubId: string,
  input: { title: string; body?: string }
): Promise<{ id: string }> {
  const userId = await requireAuth();
  await requireClubMember(clubId, userId);

  const title = input.title.trim();
  if (!title) throw new Error('A thread title is required');

  const [thread] = await db
    .insert(clubThreads)
    .values({
      clubId,
      createdBy: userId,
      title,
      body: input.body?.trim() || null,
    })
    .returning({ id: clubThreads.id });

  revalidatePath(`/bookclubs/${clubId}`);
  revalidatePath(`/bookclubs/${clubId}/discussions`);
  return { id: thread.id };
}

// Reply to a thread. Members only.
export async function addComment(
  threadId: string,
  body: string
): Promise<void> {
  const userId = await requireAuth();

  const [thread] = await db
    .select({
      clubId: clubThreads.clubId,
      author: clubThreads.createdBy,
      title: clubThreads.title,
    })
    .from(clubThreads)
    .where(eq(clubThreads.id, threadId))
    .limit(1);
  if (!thread) throw new Error('Thread not found');

  await requireClubMember(thread.clubId, userId);

  const trimmed = body.trim();
  if (!trimmed) throw new Error('Write something first');

  await db
    .insert(clubThreadComments)
    .values({ threadId, createdBy: userId, body: trimmed });

  // Notify the thread's author (unless they're replying to themselves).
  if (thread.author !== userId) {
    await createNotifications([
      {
        userId: thread.author,
        type: 'thread_reply',
        title: 'New reply',
        body: `New reply on “${thread.title}”`,
        link: `/bookclubs/${thread.clubId}/discussions#thread-${threadId}`,
      },
    ]);
  }

  revalidatePath(`/bookclubs/${thread.clubId}/discussions`);
}

// Toggle the viewer's emoji reaction on a thread. Members only.
export async function toggleThreadReaction(
  threadId: string,
  emoji: string
): Promise<void> {
  const userId = await requireAuth();
  const e = emoji.trim();
  if (!e) return;

  const [thread] = await db
    .select({ clubId: clubThreads.clubId })
    .from(clubThreads)
    .where(eq(clubThreads.id, threadId))
    .limit(1);
  if (!thread) throw new Error('Thread not found');
  await requireClubMember(thread.clubId, userId);

  const removed = await db
    .delete(threadReactions)
    .where(
      and(
        eq(threadReactions.userId, userId),
        eq(threadReactions.threadId, threadId),
        eq(threadReactions.emoji, e)
      )
    )
    .returning({ emoji: threadReactions.emoji });

  if (removed.length === 0) {
    await db
      .insert(threadReactions)
      .values({ userId, threadId, emoji: e })
      .onConflictDoNothing();
  }

  revalidatePath(`/bookclubs/${thread.clubId}/discussions`);
}

// Toggle the viewer's emoji reaction on a comment. Members only.
export async function toggleCommentReaction(
  commentId: string,
  emoji: string
): Promise<void> {
  const userId = await requireAuth();
  const e = emoji.trim();
  if (!e) return;

  const [row] = await db
    .select({ clubId: clubThreads.clubId })
    .from(clubThreadComments)
    .innerJoin(clubThreads, eq(clubThreadComments.threadId, clubThreads.id))
    .where(eq(clubThreadComments.id, commentId))
    .limit(1);
  if (!row) throw new Error('Comment not found');
  await requireClubMember(row.clubId, userId);

  const removed = await db
    .delete(commentReactions)
    .where(
      and(
        eq(commentReactions.userId, userId),
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.emoji, e)
      )
    )
    .returning({ emoji: commentReactions.emoji });

  if (removed.length === 0) {
    await db
      .insert(commentReactions)
      .values({ userId, commentId, emoji: e })
      .onConflictDoNothing();
  }

  revalidatePath(`/bookclubs/${row.clubId}/discussions`);
}
