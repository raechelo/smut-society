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

export const rsvpStatusEnum = pgEnum('rsvp_status', ['going', 'not_going']);

export const progressUnitEnum = pgEnum('progress_unit', ['chapter', 'page']);

export const goalStatusEnum = pgEnum('goal_status', [
  'in progress',
  'completed',
]);

// The unit a custom goal is measured in — a target of books, pages, or hours.
export const goalUnitEnum = pgEnum('goal_unit', ['books', 'pages', 'hours']);

// How a user's read of a book turned out. 'in progress' keeps it on the
// currently-reading shelf; 'completed' counts toward the reading goal; 'dnf'
// (did not finish) leaves the shelf but is not counted as a finished book.
export const readStatusEnum = pgEnum('read_status', [
  'in progress',
  'completed',
  'dnf',
]);

// ─── Clubs ───────────────────────────────────────────────────────────────────

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  // Public clubs appear in Explore and can be joined by anyone. The DB default
  // only backfills existing rows; the create form requires an explicit choice.
  isPublic: boolean('is_public').notNull().default(false),
  // The book the club is currently reading. Denormalized from Google Books
  // (like nominations) so we can render it without re-fetching. Null until an
  // admin promotes a nomination to the club's next read.
  currentBookId: text('current_book_id'),
  currentBookTitle: text('current_book_title'),
  currentBookCover: text('current_book_cover'),
  currentBookAuthor: text('current_book_author'),
  currentBookSetAt: timestamp('current_book_set_at'),
  // When set, the club is archived: hidden from Explore and read as inactive.
  // Null means active. An admin can archive/restore from the manage section.
  archivedAt: timestamp('archived_at'),
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

// A scheduled club event (meeting, discussion, watch party…). startsAt is the
// event's start time; the club page surfaces the soonest upcoming one.
export const clubEvents = pgTable('club_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  clubId: uuid('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  location: text('location'),
  startsAt: timestamp('starts_at', { mode: 'date' }).notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// A member's reading progress on a specific club book. Keyed on
// (user, club, book) so history survives when the club moves to the next read.
// value is the chapter or page number (per `unit`); finished overrides it.
export const readingProgress = pgTable(
  'reading_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clubId: uuid('club_id')
      .notNull()
      .references(() => clubs.id, { onDelete: 'cascade' }),
    bookId: text('book_id').notNull(),
    unit: progressUnitEnum('unit').notNull().default('chapter'),
    value: integer('value').notNull().default(0),
    finished: boolean('finished').notNull().default(false),
    // How this read turned out. `finished` stays the source of truth for
    // "completed" (kept in sync); `status` additionally distinguishes a 'dnf'
    // read from one that's still 'in progress'.
    status: readStatusEnum('status').notNull().default('in progress'),
    // When the user started/stopped this book, set from the review dialog.
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.clubId, t.bookId] })]
);

// A member's RSVP to a club event. One row per (event, user); status flips
// between going/not_going, and the row is removed when they clear their RSVP.
export const eventRsvps = pgTable(
  'event_rsvps',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => clubEvents.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: rsvpStatusEnum('status').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] })]
);

// A book the club has finished reading. Denormalized from Google Books like
// nominations/current book, so the "previously read" list renders without a
// re-fetch. Populated when an admin marks the current book as finished.
export const clubFinishedBooks = pgTable('club_finished_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  clubId: uuid('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  bookId: text('book_id').notNull(),
  bookTitle: text('book_title').notNull(),
  bookCover: text('book_cover'),
  bookAuthor: text('book_author'),
  finishedAt: timestamp('finished_at').notNull().defaultNow(),
});

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

// ─── Discussions ──────────────────────────────────────────────────────────────

// A discussion thread within a club — the top-level post of a threaded board.
export const clubThreads = pgTable('club_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  clubId: uuid('club_id')
    .notNull()
    .references(() => clubs.id, { onDelete: 'cascade' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  // Optional opening message for the thread.
  body: text('body'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// A reply on a discussion thread.
export const clubThreadComments = pgTable('club_thread_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => clubThreads.id, { onDelete: 'cascade' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// An emoji reaction on a thread. One row per (user, thread, emoji), so a user
// can add several distinct emoji but each only once; toggling removes the row.
export const threadReactions = pgTable(
  'thread_reactions',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => clubThreads.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.threadId, t.emoji] })]
);

// An emoji reaction on a thread comment. Same shape as thread reactions.
export const commentReactions = pgTable(
  'comment_reactions',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => clubThreadComments.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId, t.emoji] })]
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

// ─── User home ────────────────────────────────────────────────────────────────

// A notification for a user — a thread reply, a new club event, a new club read.
// type is a free string ('thread_reply' | 'club_event' | 'club_book'); link is
// where clicking it should take the user.
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// A user's yearly reading goal (books to finish this year). One row per year.
// status flips to 'completed' once the target is met or the year has passed, so
// past goals can be browsed under a "Completed" tab.
export const readingGoals = pgTable(
  'reading_goals',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    target: integer('target').notNull(),
    status: goalStatusEnum('status').notNull().default('in progress'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.year] })]
);

// A user's custom, self-tracked reading goal — a named target in books, pages,
// or hours with a manually entered progress. Separate from `reading_goals`,
// which are the auto-counted yearly book goals.
export const customGoals = pgTable('custom_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: goalUnitEnum('unit').notNull(),
  target: integer('target').notNull(),
  progress: integer('progress').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// A user's private rating + spice rating (and optional written review) for a
// book, keyed by Hardcover slug. One row per (user, book); saving again updates
// it. Powers the "completed books" table on the past-reads page.
export const bookReviews = pgTable(
  'book_reviews',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: text('book_id').notNull(),
    // 1–5; nullable so a review can set spice without stars or vice versa.
    rating: integer('rating'),
    spiceRating: integer('spice_rating'),
    reviewText: text('review_text'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bookId] })]
);

// A user's personal "currently reading" shelf — books they've added from the
// library, independent of any book club. Denormalized from Google Books.
export const readingShelf = pgTable(
  'reading_shelf',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookId: text('book_id').notNull(),
    bookTitle: text('book_title').notNull(),
    bookCover: text('book_cover'),
    bookAuthor: text('book_author'),
    // How this read turned out. 'in progress' keeps the book on the shelf;
    // 'completed'/'dnf' take it off. Completed books (finishedAt set and not a
    // dnf) count toward the year's reading goal.
    status: readStatusEnum('status').notNull().default('in progress'),
    // When the user started reading, set from the review dialog.
    startedAt: timestamp('started_at'),
    // Set when the user finishes or gives up on the book — it then leaves the
    // currently reading shelf. Only counts toward the goal when status isn't
    // 'dnf'.
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bookId] })]
);
