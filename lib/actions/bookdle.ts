'use server';

import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { games, gameEntries } from '@/lib/schema';
import { bookBySlug } from '@/lib/hardcover';
import { generateBookdle } from '@/lib/bookdle-word';

const MAX_TRIES = 6;

export type LetterStatus = 'correct' | 'present' | 'absent';
export type GuessResult = { letter: string; status: LetterStatus }[];
export type BookdleStatus = 'playing' | 'won' | 'lost';
export type BookdleReveal = {
  word: string;
  title: string;
  author: string | null;
  cover: string | null;
};
export type BookdleState = {
  gameId: string;
  length: number;
  maxTries: number;
  guesses: GuessResult[];
  status: BookdleStatus;
  reveal: BookdleReveal | null;
  signedIn: boolean;
};
export type GuessOutcome = {
  result: GuessResult;
  status: BookdleStatus;
  reveal: BookdleReveal | null;
};

// The per-user, per-game record stored in game_entries.answer.
type BookdleEntry = { guesses: string[]; won: boolean };

// UTC day, so everyone shares the same puzzle regardless of timezone.
const todayKey = (): string => new Date().toISOString().slice(0, 10);

// Standard Wordle two-pass scoring (correct first, then present, honoring
// duplicate-letter counts).
function evaluate(guess: string, answer: string): GuessResult {
  const result: GuessResult = guess
    .split('')
    .map((letter) => ({ letter, status: 'absent' as LetterStatus }));
  const remaining = new Map<string, number>();
  for (const ch of answer) remaining.set(ch, (remaining.get(ch) ?? 0) + 1);

  guess.split('').forEach((ch, i) => {
    if (answer[i] === ch) {
      result[i].status = 'correct';
      remaining.set(ch, (remaining.get(ch) ?? 0) - 1);
    }
  });
  guess.split('').forEach((ch, i) => {
    if (result[i].status === 'correct') return;
    if ((remaining.get(ch) ?? 0) > 0) {
      result[i].status = 'present';
      remaining.set(ch, (remaining.get(ch) ?? 0) - 1);
    }
  });
  return result;
}

// Return today's game, generating (and caching) it on the first request of the
// day. Reads pick the earliest row so a rare double-generate stays consistent.
async function ensureTodayGame(): Promise<{
  id: string;
  answer: string;
  bookId: string;
} | null> {
  const date = todayKey();
  const [existing] = await db
    .select({ id: games.id, answer: games.answer, bookId: games.bookId })
    .from(games)
    .where(and(eq(games.type, 'bookdle'), eq(games.date, date)))
    .orderBy(asc(games.createdAt))
    .limit(1);
  if (existing?.answer && existing.bookId) {
    return { id: existing.id, answer: existing.answer, bookId: existing.bookId };
  }

  const generated = await generateBookdle();
  if (!generated) return null;

  const [row] = await db
    .insert(games)
    .values({
      type: 'bookdle',
      bookId: generated.bookId,
      date,
      answer: generated.word,
      isActive: true,
    })
    .returning({ id: games.id });

  return { id: row.id, answer: generated.word, bookId: generated.bookId };
}

// Rebuild the "which book was it" reveal from the stored slug.
async function buildReveal(
  bookId: string,
  answer: string
): Promise<BookdleReveal> {
  const book = await bookBySlug(bookId);
  return {
    word: answer,
    title: book?.title ?? 'a mystery book',
    author: book?.authors?.[0] ?? null,
    cover: book?.cover ?? null,
  };
}

export async function getTodayBookdle(): Promise<BookdleState | null> {
  const session = await auth();
  const signedIn = !!session?.user?.id;

  const game = await ensureTodayGame();
  if (!game) return null;

  let guesses: string[] = [];
  let won = false;
  if (session?.user?.id) {
    const [entry] = await db
      .select({ answer: gameEntries.answer })
      .from(gameEntries)
      .where(
        and(
          eq(gameEntries.userId, session.user.id),
          eq(gameEntries.gameId, game.id)
        )
      )
      .limit(1);
    const data = entry?.answer as BookdleEntry | undefined;
    guesses = data?.guesses ?? [];
    won = data?.won ?? false;
  }

  const status: BookdleStatus = won
    ? 'won'
    : guesses.length >= MAX_TRIES
      ? 'lost'
      : 'playing';

  return {
    gameId: game.id,
    length: game.answer.length,
    maxTries: MAX_TRIES,
    guesses: guesses.map((g) => evaluate(g, game.answer)),
    status,
    reveal: status === 'playing' ? null : await buildReveal(game.bookId, game.answer),
    signedIn,
  };
}

// Score one guess, persist the user's progress, and return the result. The
// answer is only ever revealed once the game is over.
export async function submitBookdleGuess(
  rawGuess: string
): Promise<GuessOutcome> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Sign in to play');
  const userId = session.user.id;

  const game = await ensureTodayGame();
  if (!game) throw new Error('No puzzle available today');

  const guess = rawGuess.toUpperCase().replace(/[^A-Z]/g, '');
  if (guess.length !== game.answer.length) {
    throw new Error(`Guess must be ${game.answer.length} letters`);
  }
  // Light guard against consonant-mashing — but never block the real answer,
  // in case the day's word happens to have no vowels.
  if (!/[AEIOU]/.test(guess) && guess !== game.answer) {
    throw new Error('Guesses need at least one vowel');
  }

  const [entry] = await db
    .select({ answer: gameEntries.answer })
    .from(gameEntries)
    .where(and(eq(gameEntries.userId, userId), eq(gameEntries.gameId, game.id)))
    .limit(1);
  const prev = (entry?.answer as BookdleEntry | undefined) ?? {
    guesses: [],
    won: false,
  };
  if (prev.won || prev.guesses.length >= MAX_TRIES) {
    throw new Error("You've already finished today's puzzle");
  }

  const guesses = [...prev.guesses, guess];
  const won = guess === game.answer;
  const done = won || guesses.length >= MAX_TRIES;

  await db
    .insert(gameEntries)
    .values({ userId, gameId: game.id, answer: { guesses, won } })
    .onConflictDoUpdate({
      target: [gameEntries.userId, gameEntries.gameId],
      set: { answer: { guesses, won }, completedAt: new Date() },
    });

  return {
    result: evaluate(guess, game.answer),
    status: won ? 'won' : done ? 'lost' : 'playing',
    reveal: done ? await buildReveal(game.bookId, game.answer) : null,
  };
}
