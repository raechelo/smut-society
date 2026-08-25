// Picks the daily Bookdle word: fetch a popular romance book and extract one
// memorable in-world word (character/place/term) from its title + description.
// Uses Claude when ANTHROPIC_API_KEY is set, and falls back to a proper-noun
// heuristic otherwise. Server-only (network + secrets) — imported by the action.
import Anthropic from '@anthropic-ai/sdk';
import { popularBooks } from '@/lib/hardcover';

export type BookdleWord = {
  bookId: string;
  word: string;
  title: string;
  author: string | null;
  cover: string | null;
};

const MIN_LEN = 5;
const MAX_LEN = 8;

// Words we never want as the answer even if capitalized in a blurb.
const STOPWORDS = new Set([
  'THE', 'AND', 'BUT', 'FOR', 'WITH', 'FROM', 'THIS', 'THAT', 'THEY', 'THEIR',
  'THERE', 'THEN', 'THAN', 'INTO', 'OVER', 'ONLY', 'JUST', 'EVEN', 'WHEN',
  'WHERE', 'WHAT', 'WHO', 'WHY', 'HOW', 'SHE', 'HER', 'HERS', 'HIS', 'HIM',
  'ONE', 'TWO', 'NEW', 'YORK', 'TIMES', 'USA', 'TODAY', 'BESTSELLER',
  'BESTSELLING', 'NOVEL', 'BOOK', 'SERIES', 'STORY', 'AUTHOR', 'AFTER',
  'BEFORE', 'ONCE', 'EVER', 'NEVER', 'ALWAYS', 'EVERY', 'SOME', 'MOST', 'MORE',
  'MANY', 'MUCH', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'BEEN', 'WERE', 'HAVE',
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'JUNE', 'JULY', 'AUGUST',
  'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]);

const authorTokens = (author: string | null): string[] =>
  author ? author.toUpperCase().split(/\s+/).filter(Boolean) : [];

function isValid(word: string, banned: Set<string>): boolean {
  return (
    /^[A-Z]+$/.test(word) &&
    word.length >= MIN_LEN &&
    word.length <= MAX_LEN &&
    !banned.has(word)
  );
}

const sanitize = (raw: string): string =>
  (raw.trim().split(/\s+/)[0] ?? '').toUpperCase().replace(/[^A-Z]/g, '');

// Ask Claude for a single iconic word. Returns null when unconfigured or invalid.
async function extractWithClaude(
  title: string,
  author: string | null,
  description: string,
  banned: Set<string>
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 16,
      system:
        'You choose one word for a daily book-themed word puzzle (like Wordle). ' +
        "Pick a single memorable in-world proper noun — a main character's first " +
        'name, a place, or a signature term from the book. It must be 5 to 8 ' +
        "letters, letters only. Never use the author's name or a generic word. " +
        'Reply with ONLY that one word in uppercase, nothing else.',
      messages: [
        {
          role: 'user',
          content: `Title: ${title}\nAuthor: ${author ?? 'Unknown'}\nDescription: ${description.slice(0, 1200)}`,
        },
      ],
    });
    const block = res.content.find((b) => b.type === 'text');
    const word = sanitize(block && 'text' in block ? block.text : '');
    return isValid(word, banned) ? word : null;
  } catch (err) {
    console.error('bookdle claude extraction failed', err);
    return null;
  }
}

// No-API fallback: the most-repeated capitalized proper noun in the blurb —
// romance descriptions usually lead with the main character's name.
function extractHeuristic(description: string, banned: Set<string>): string | null {
  const counts = new Map<string, number>();
  for (const match of description.match(/\b[A-Z][a-z]{2,}\b/g) ?? []) {
    const word = match.toUpperCase();
    if (!isValid(word, banned)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [word, count] of counts) {
    if (count > bestCount) {
      best = word;
      bestCount = count;
    }
  }
  return best;
}

// Try popular books in random order until one yields a valid word.
export async function generateBookdle(): Promise<BookdleWord | null> {
  const books = await popularBooks(1, 30);
  const candidates = books
    .filter((b) => b.slug && (b.description?.length ?? 0) > 80)
    .sort(() => Math.random() - 0.5);

  for (const book of candidates) {
    const author = book.authors?.[0] ?? null;
    const description = book.description ?? '';
    const banned = new Set([
      ...STOPWORDS,
      ...authorTokens(author),
      ...book.title.toUpperCase().split(/\s+/).filter(Boolean),
    ]);

    const word =
      (await extractWithClaude(book.title, author, description, banned)) ??
      extractHeuristic(description, banned);

    if (word) {
      return { bookId: book.slug, word, title: book.title, author, cover: book.cover };
    }
  }
  return null;
}
