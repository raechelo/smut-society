'use server';

import { randomUUID } from 'node:crypto';
import { and, asc, avg, count, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  quizzes,
  quizOutcomes,
  quizQuestions,
  quizAnswers,
  quizRatings,
} from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { deleteAssetByUrl } from '@/lib/github-assets';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

// Trim, lowercase, dedupe, and cap the author's tags.
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

// The create-quiz form's payload. Outcome `id`s are the form's client-side ids;
// each answer's `outcomeId` references one of them (or null when unmapped).
export type CreateQuizInput = {
  title: string;
  description: string | null;
  tags: string[];
  outcomes: {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
  }[];
  questions: {
    text: string;
    answers: { text: string; outcomeId: string | null }[];
  }[];
};

// Validate the form input and build the fully-id'd row graph. Ids are generated
// up front so the whole thing can be inserted atomically in one batch (the
// neon-http driver can't read intermediate results mid-transaction). Shared by
// create and update.
function buildQuizGraph(input: CreateQuizInput) {
  const title = input.title.trim();
  if (!title) throw new Error('A quiz title is required');
  const description = input.description?.trim() || null;

  // Outcomes with a title, mapping each form id to a fresh db id.
  const outcomeIdByClient = new Map<string, string>();
  const outcomeValues = input.outcomes
    .filter((o) => o.title.trim())
    .map((o, i) => {
      const id = randomUUID();
      outcomeIdByClient.set(o.id, id);
      return {
        id,
        title: o.title.trim(),
        description: o.description.trim() || null,
        imageUrl: o.imageUrl || null,
        position: i,
      };
    });
  if (outcomeValues.length === 0) throw new Error('Add at least one outcome');

  // Questions with at least one non-empty answer; answers resolve their outcome
  // id through the map (dropping references to outcomes that were filtered out).
  const questionValues: { id: string; text: string; position: number }[] = [];
  const answerValues: {
    id: string;
    questionId: string;
    text: string;
    outcomeId: string | null;
    position: number;
  }[] = [];

  for (const q of input.questions) {
    const text = q.text.trim();
    const answers = q.answers.filter((a) => a.text.trim());
    if (!text || answers.length === 0) continue;

    const questionId = randomUUID();
    questionValues.push({ id: questionId, text, position: questionValues.length });
    answers.forEach((a, ai) => {
      answerValues.push({
        id: randomUUID(),
        questionId,
        text: a.text.trim(),
        outcomeId: a.outcomeId ? outcomeIdByClient.get(a.outcomeId) ?? null : null,
        position: ai,
      });
    });
  }
  if (questionValues.length === 0) {
    throw new Error('Add at least one question with an answer');
  }

  return {
    title,
    description,
    tags: normalizeTags(input.tags),
    outcomeValues,
    questionValues,
    answerValues,
  };
}

// Persist a new quiz with its outcomes, questions, and answers.
export async function createQuiz(
  input: CreateQuizInput
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const graph = buildQuizGraph(input);
  const quizId = randomUUID();

  await db.batch([
    db.insert(quizzes).values({
      id: quizId,
      title: graph.title,
      description: graph.description,
      tags: graph.tags,
      createdBy: session.user.id,
    }),
    db.insert(quizOutcomes).values(graph.outcomeValues.map((o) => ({ ...o, quizId }))),
    db.insert(quizQuestions).values(graph.questionValues.map((q) => ({ ...q, quizId }))),
    db.insert(quizAnswers).values(graph.answerValues),
  ]);

  revalidatePath('/quizzes');
  return { id: quizId };
}

// Replace a quiz's content in place. Owner-only. The children are rebuilt from
// scratch (delete + re-insert with fresh ids), so answer→outcome links stay
// consistent; the quiz id — and thus its ratings — are preserved.
export async function updateQuiz(
  quizId: string,
  input: CreateQuizInput
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [quiz] = await db
    .select({ createdBy: quizzes.createdBy })
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.createdBy !== session.user.id) {
    throw new Error('Only the quiz owner can edit it');
  }

  // Snapshot the current outcome images so we can delete any dropped by this
  // edit once the rewrite succeeds.
  const previousImages = await db
    .select({ imageUrl: quizOutcomes.imageUrl })
    .from(quizOutcomes)
    .where(eq(quizOutcomes.quizId, quizId));
  const oldImageUrls = previousImages
    .map((r) => r.imageUrl)
    .filter((u): u is string => !!u);

  const graph = buildQuizGraph(input);

  await db.batch([
    db
      .update(quizzes)
      .set({
        title: graph.title,
        description: graph.description,
        tags: graph.tags,
      })
      .where(eq(quizzes.id, quizId)),
    // Delete questions first (answers cascade), then outcomes.
    db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId)),
    db.delete(quizOutcomes).where(eq(quizOutcomes.quizId, quizId)),
    db.insert(quizOutcomes).values(graph.outcomeValues.map((o) => ({ ...o, quizId }))),
    db.insert(quizQuestions).values(graph.questionValues.map((q) => ({ ...q, quizId }))),
    db.insert(quizAnswers).values(graph.answerValues),
  ]);

  // Delete images that are no longer referenced by any surviving outcome.
  const keptImageUrls = new Set(
    graph.outcomeValues
      .map((o) => o.imageUrl)
      .filter((u): u is string => !!u)
  );
  await Promise.all(
    oldImageUrls
      .filter((url) => !keptImageUrls.has(url))
      .map((url) => deleteAssetByUrl(url))
  );

  revalidatePath(`/quizzes/${quizId}`);
  revalidatePath('/quizzes');
  revalidatePath('/home');
  return { id: quizId };
}

export type QuizListItem = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: Date;
  questionCount: number;
  outcomeCount: number;
  // Average of members' 1–5 ratings (null when unrated) and how many rated.
  avgRating: number | null;
  ratingCount: number;
};

type QuizRow = Omit<
  QuizListItem,
  'questionCount' | 'outcomeCount' | 'avgRating' | 'ratingCount'
>;

// Attach question/outcome tallies and rating aggregates to a set of quiz rows.
async function withCounts(rows: QuizRow[]): Promise<QuizListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [questionCounts, outcomeCounts, ratingRows] = await Promise.all([
    db
      .select({ quizId: quizQuestions.quizId, n: count() })
      .from(quizQuestions)
      .where(inArray(quizQuestions.quizId, ids))
      .groupBy(quizQuestions.quizId),
    db
      .select({ quizId: quizOutcomes.quizId, n: count() })
      .from(quizOutcomes)
      .where(inArray(quizOutcomes.quizId, ids))
      .groupBy(quizOutcomes.quizId),
    db
      .select({
        quizId: quizRatings.quizId,
        avg: avg(quizRatings.rating),
        n: count(),
      })
      .from(quizRatings)
      .where(inArray(quizRatings.quizId, ids))
      .groupBy(quizRatings.quizId),
  ]);

  const qByQuiz = new Map(questionCounts.map((r) => [r.quizId, Number(r.n)]));
  const oByQuiz = new Map(outcomeCounts.map((r) => [r.quizId, Number(r.n)]));
  const rByQuiz = new Map(
    ratingRows.map((r) => [
      r.quizId,
      { avg: r.avg != null ? Number(r.avg) : null, n: Number(r.n) },
    ])
  );

  return rows.map((r) => ({
    ...r,
    questionCount: qByQuiz.get(r.id) ?? 0,
    outcomeCount: oByQuiz.get(r.id) ?? 0,
    avgRating: rByQuiz.get(r.id)?.avg ?? null,
    ratingCount: rByQuiz.get(r.id)?.n ?? 0,
  }));
}

const quizColumns = {
  id: quizzes.id,
  title: quizzes.title,
  description: quizzes.description,
  tags: quizzes.tags,
  createdAt: quizzes.createdAt,
};

// All quizzes, newest first, with question/outcome tallies for the cards.
export async function getQuizzes(): Promise<QuizListItem[]> {
  const rows = await db
    .select(quizColumns)
    .from(quizzes)
    .orderBy(desc(quizzes.createdAt));
  return withCounts(rows);
}

export type QuizDetail = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  // The quiz's creator — used to show owner-only edit/delete controls.
  createdBy: string;
  questions: {
    id: string;
    text: string;
    answers: { id: string; text: string }[];
  }[];
};

// A single quiz with its questions and answers (ordered), or null when it
// doesn't exist. Answers omit their outcome mapping — that's server-side only.
export async function getQuizDetail(id: string): Promise<QuizDetail | null> {
  const [quiz] = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      tags: quizzes.tags,
      createdBy: quizzes.createdBy,
    })
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);
  if (!quiz) return null;

  const questionRows = await db
    .select({ id: quizQuestions.id, text: quizQuestions.text })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, id))
    .orderBy(asc(quizQuestions.position));

  const answersByQuestion = new Map<string, { id: string; text: string }[]>();
  if (questionRows.length > 0) {
    const answerRows = await db
      .select({
        id: quizAnswers.id,
        questionId: quizAnswers.questionId,
        text: quizAnswers.text,
      })
      .from(quizAnswers)
      .where(
        inArray(
          quizAnswers.questionId,
          questionRows.map((q) => q.id)
        )
      )
      .orderBy(asc(quizAnswers.position));
    for (const a of answerRows) {
      const list = answersByQuestion.get(a.questionId);
      if (list) list.push({ id: a.id, text: a.text });
      else answersByQuestion.set(a.questionId, [{ id: a.id, text: a.text }]);
    }
  }

  return {
    ...quiz,
    questions: questionRows.map((q) => ({
      id: q.id,
      text: q.text,
      answers: answersByQuestion.get(q.id) ?? [],
    })),
  };
}

export type QuizEditData = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  outcomes: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
  }[];
  questions: {
    id: string;
    text: string;
    answers: { id: string; text: string; outcomeId: string | null }[];
  }[];
};

// The full editable quiz graph — including answer→outcome links and outcome
// images — for the owner only. Returns null for non-owners or a missing quiz,
// so the edit page can render not-found.
export async function getQuizForEdit(
  id: string
): Promise<QuizEditData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [quiz] = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      description: quizzes.description,
      tags: quizzes.tags,
      createdBy: quizzes.createdBy,
    })
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);
  if (!quiz || quiz.createdBy !== session.user.id) return null;

  const outcomes = await db
    .select({
      id: quizOutcomes.id,
      title: quizOutcomes.title,
      description: quizOutcomes.description,
      imageUrl: quizOutcomes.imageUrl,
    })
    .from(quizOutcomes)
    .where(eq(quizOutcomes.quizId, id))
    .orderBy(asc(quizOutcomes.position));

  const questionRows = await db
    .select({ id: quizQuestions.id, text: quizQuestions.text })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, id))
    .orderBy(asc(quizQuestions.position));

  const answersByQuestion = new Map<
    string,
    { id: string; text: string; outcomeId: string | null }[]
  >();
  if (questionRows.length > 0) {
    const answerRows = await db
      .select({
        id: quizAnswers.id,
        questionId: quizAnswers.questionId,
        text: quizAnswers.text,
        outcomeId: quizAnswers.outcomeId,
      })
      .from(quizAnswers)
      .where(
        inArray(
          quizAnswers.questionId,
          questionRows.map((q) => q.id)
        )
      )
      .orderBy(asc(quizAnswers.position));
    for (const a of answerRows) {
      const entry = { id: a.id, text: a.text, outcomeId: a.outcomeId };
      const list = answersByQuestion.get(a.questionId);
      if (list) list.push(entry);
      else answersByQuestion.set(a.questionId, [entry]);
    }
  }

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    tags: quiz.tags,
    outcomes,
    questions: questionRows.map((q) => ({
      id: q.id,
      text: q.text,
      answers: answersByQuestion.get(q.id) ?? [],
    })),
  };
}

export type QuizResult = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

// Tally the selected answers into a winning outcome. Runs server-side because
// the answer→outcome mapping is never sent to the client. `answerIds` are
// validated to belong to this quiz. Ties break toward the earliest outcome; a
// quiz with no mapped answers falls back to the first outcome.
export async function scoreQuiz(
  quizId: string,
  answerIds: string[]
): Promise<QuizResult | null> {
  const outcomes = await db
    .select({
      id: quizOutcomes.id,
      title: quizOutcomes.title,
      description: quizOutcomes.description,
      imageUrl: quizOutcomes.imageUrl,
    })
    .from(quizOutcomes)
    .where(eq(quizOutcomes.quizId, quizId))
    .orderBy(asc(quizOutcomes.position));
  if (outcomes.length === 0) return null;

  const tally = new Map<string, number>();
  if (answerIds.length > 0) {
    const rows = await db
      .select({ outcomeId: quizAnswers.outcomeId })
      .from(quizAnswers)
      .innerJoin(quizQuestions, eq(quizAnswers.questionId, quizQuestions.id))
      .where(
        and(
          eq(quizQuestions.quizId, quizId),
          inArray(quizAnswers.id, answerIds)
        )
      );
    for (const r of rows) {
      if (r.outcomeId) {
        tally.set(r.outcomeId, (tally.get(r.outcomeId) ?? 0) + 1);
      }
    }
  }

  let winner = outcomes[0];
  let winnerCount = tally.get(winner.id) ?? 0;
  for (const outcome of outcomes) {
    const c = tally.get(outcome.id) ?? 0;
    if (c > winnerCount) {
      winner = outcome;
      winnerCount = c;
    }
  }
  return winner;
}

// The signed-in user's own rating for a quiz (1–5), or null if unrated / signed
// out. Used to pre-fill the stars on the result screen.
export async function getMyQuizRating(quizId: string): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [row] = await db
    .select({ rating: quizRatings.rating })
    .from(quizRatings)
    .where(
      and(
        eq(quizRatings.userId, session.user.id),
        eq(quizRatings.quizId, quizId)
      )
    )
    .limit(1);
  return row?.rating ?? null;
}

// Save the signed-in user's 1–5 rating for a quiz. Upserts, so re-rating
// overwrites the previous value.
export async function rateQuiz(quizId: string, rating: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const value = Math.round(rating);
  if (value < 1 || value > 5) throw new Error('Rating must be between 1 and 5');

  await db
    .insert(quizRatings)
    .values({ userId: session.user.id, quizId, rating: value })
    .onConflictDoUpdate({
      target: [quizRatings.userId, quizRatings.quizId],
      set: { rating: value, updatedAt: new Date() },
    });

  revalidatePath(`/quizzes/${quizId}`);
}

// The signed-in user's own quizzes, newest first.
export async function getMyQuizzes(): Promise<QuizListItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await db
    .select(quizColumns)
    .from(quizzes)
    .where(eq(quizzes.createdBy, session.user.id))
    .orderBy(desc(quizzes.createdAt));
  return withCounts(rows);
}

// Delete a quiz. Owner-only; questions, outcomes, and answers cascade off the
// quiz's foreign keys.
export async function deleteQuiz(quizId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [quiz] = await db
    .select({ createdBy: quizzes.createdBy })
    .from(quizzes)
    .where(eq(quizzes.id, quizId))
    .limit(1);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.createdBy !== session.user.id) {
    throw new Error('Only the quiz owner can delete it');
  }

  // Grab the outcome images before the rows cascade away, then clean them up.
  const images = await db
    .select({ imageUrl: quizOutcomes.imageUrl })
    .from(quizOutcomes)
    .where(eq(quizOutcomes.quizId, quizId));

  await db.delete(quizzes).where(eq(quizzes.id, quizId));

  await Promise.all(
    images
      .map((r) => r.imageUrl)
      .filter((u): u is string => !!u)
      .map((url) => deleteAssetByUrl(url))
  );

  revalidatePath('/quizzes');
  revalidatePath('/home');
}
