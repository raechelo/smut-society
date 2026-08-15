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
      cornerDecoration='top-right'
      className='w-full flex-row gap-lg'
    >
      {book.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover}
          alt={book.title}
          className='h-[240px] w-40 shrink-0 rounded-md object-cover shadow-sm'
        />
      ) : (
        <div className='flex h-[240px] w-40 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
          <BookOpen className='size-10' />
        </div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <Typography
          variant='caption'
          classNames='flex items-center gap-1.5 text-accent-dark dark:text-accent-light'
        >
          <Sparkles className='size-3.5' />
          Librarian&apos;s pick · this week
        </Typography>
        <Typography
          variant='h2'
          display
          classNames='!mb-0 leading-tight'
        >
          {book.title}
        </Typography>
        <Typography
          variant='p2'
          color='muted'
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
            classNames='line-clamp-4 leading-relaxed text-foreground/90'
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
                colors='wine'
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
