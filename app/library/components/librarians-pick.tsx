import { BookOpen, Sparkles } from 'lucide-react';
import { topBook } from '@/lib/hardcover';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';

// TODO: stubbed weekly pick — a hardcoded rotation of titles until real picks
// are curated. Rotates by ISO week so it changes weekly.
const PICKS = [
  'Heated Rivalry',
  'A Court of Thorns and Roses',
  'The Love Hypothesis',
  'Fourth Wing',
  'Red, White & Royal Blue',
];

function weekIndex(len: number): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor(
    (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return ((week % len) + len) % len;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trim();
}

export async function LibrariansPick() {
  const book = await topBook(PICKS[weekIndex(PICKS.length)]);
  if (!book) return null;

  return (
    <Card
      shadow
      cornerDecoration='all'
      className='h-[30%] min-h-0 w-full shrink-0 flex-row gap-lg bg-sidebar text-sidebar-foreground'
    >
      {/* Wrapped so the card's `>img:first-child` top-padding rule (meant for
          cover-on-top grid cards) doesn't misfire in this side-by-side layout.
          The cover scales to the card's height and keeps book proportions. */}
      <div className='relative aspect-[2/3] h-full shrink-0 overflow-hidden rounded-md shadow-sm'>
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover}
            alt={book.title}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-sidebar-accent text-sidebar-foreground/60'>
            <BookOpen className='size-10' />
          </div>
        )}
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-1.5 overflow-hidden'>
        <Typography
          variant='caption'
          classNames='flex items-center gap-1.5 text-sidebar-accent-foreground'
        >
          <Sparkles className='size-3.5' />
          Librarian&apos;s pick · this week
        </Typography>
        <Typography
          variant='h2'
          display
          classNames='!mb-0 leading-tight text-sidebar-foreground'
        >
          {book.title}
        </Typography>
        <Typography
          variant='p2'
          classNames='text-sidebar-foreground/70'
        >
          {[
            book.authors.join(', '),
            book.genres[0],
            book.pages ? `${book.pages} pages` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        {book.description && (
          <Typography
            variant='p2'
            classNames='line-clamp-3 leading-relaxed text-sidebar-foreground/85'
          >
            {stripHtml(book.description)}
          </Typography>
        )}
        {book.genres.length > 0 && (
          <div className='mt-auto flex flex-wrap gap-1.5 pt-1'>
            {book.genres.slice(0, 4).map((g) => (
              <Chip
                key={g}
                label={g}
                size='small'
                variant='painted'
                colors='accent'
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
