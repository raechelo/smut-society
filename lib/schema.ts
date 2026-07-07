import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ─── NextAuth required tables ────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Enums ───────────────────────────────────────────────────────────────────

export const gameTypeEnum = pgEnum('game_type', [
  'bookdle',
  'quote',
  'poll',
  'spice',
]);

export const clubRoleEnum = pgEnum('club_role', ['member', 'admin']);

// ─── Clubs ───────────────────────────────────────────────────────────────────

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const clubMembers = pgTable(
  'club_members',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    role: clubRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.clubId] })]
);

// ─── Games ───────────────────────────────────────────────────────────────────

// A game is a challenge instance: e.g. today's Bookdle, the Spice poll for a specific book.
// bookId is a Google Books volume ID; date is set for daily games like Bookdle.
// answer stores the correct answer for Bookdle.
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: gameTypeEnum('type').notNull(),
  bookId: text('book_id'),
  date: date('date'),
  answer: text('answer'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// A user's submission for a given game. One entry per user per game.
// answer shape varies by game type:
//   bookdle: { guesses: string[], won: boolean, tries: number }
//   quote:   { text: string }
//   poll:    { before: number, after: number }  (1–5 scale)
//   spice:   { expected: number, actual: number }  (pepper count)
export const gameEntries = pgTable(
  'game_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    answer: jsonb('answer').notNull(),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.gameId)]
);

// ─── Club nominations ────────────────────────────────────────────────────────

// A book nominated by a member for the club's next read pool.
// bookId/bookTitle/bookCover/bookAuthor are denormalized from Google Books so
// we don't need to re-fetch the API to display the nomination list.
// Unique on (clubId, bookId) so the same book can't be nominated twice per club.
export const clubNominations = pgTable(
  'club_nominations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    nominatedBy: text('nominated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: text('book_id').notNull(),
    bookTitle: text('book_title').notNull(),
    bookCover: text('book_cover'),
    bookAuthor: text('book_author'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.clubId, t.bookId)]
);

// Upvote cast by a club member on a nomination.
export const nominationVotes = pgTable(
  'nomination_votes',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nominationId: uuid('nomination_id')
      .notNull()
      .references(() => clubNominations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.nominationId] })]
);

// ─── Favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: text('book_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bookId] })]
);
