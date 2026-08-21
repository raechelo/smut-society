'use server';

import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  quizzes,
  quizOutcomes,
  quizQuestions,
  quizAnswers,
} from '@/lib/schema';
import { revalidatePath } from 'next/cache';

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
  outcomes: { id: string; title: string; description: string }[];
  questions: {
    text: string;
    answers: { text: string; outcomeId: string | null }[];
  }[];
};

// Persist a new quiz with its outcomes, questions, and answers. Ids are
// generated up front so the whole graph can be inserted atomically in one
// batch (the neon-http driver can't read intermediate results mid-transaction).
export async function createQuiz(
  input: CreateQuizInput
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const userId = session.user.id;

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
        position: i,
      };
    });
  if (outcomeValues.length === 0) throw new Error('Add at least one outcome');

  // Questions with at least one non-empty answer; answers resolve their outcome
  // id through the map (dropping references to outcomes that were filtered out).
  const questionValues: {
    id: string;
    text: string;
    position: number;
  }[] = [];
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

  const quizId = randomUUID();

  await db.batch([
    db.insert(quizzes).values({
      id: quizId,
      title,
      description,
      tags: normalizeTags(input.tags),
      createdBy: userId,
    }),
    db
      .insert(quizOutcomes)
      .values(outcomeValues.map((o) => ({ ...o, quizId }))),
    db
      .insert(quizQuestions)
      .values(questionValues.map((q) => ({ ...q, quizId }))),
    db.insert(quizAnswers).values(answerValues),
  ]);

  revalidatePath('/quizzes');
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
};

type QuizRow = Omit<QuizListItem, 'questionCount' | 'outcomeCount'>;

// Attach question/outcome tallies to a set of quiz rows.
async function withCounts(rows: QuizRow[]): Promise<QuizListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [questionCounts, outcomeCounts] = await Promise.all([
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
  ]);

  const qByQuiz = new Map(questionCounts.map((r) => [r.quizId, Number(r.n)]));
  const oByQuiz = new Map(outcomeCounts.map((r) => [r.quizId, Number(r.n)]));

  return rows.map((r) => ({
    ...r,
    questionCount: qByQuiz.get(r.id) ?? 0,
    outcomeCount: oByQuiz.get(r.id) ?? 0,
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

export type QuizResult = {
  id: string;
  title: string;
  description: string | null;
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

  await db.delete(quizzes).where(eq(quizzes.id, quizId));

  revalidatePath('/quizzes');
  revalidatePath('/home');
}
