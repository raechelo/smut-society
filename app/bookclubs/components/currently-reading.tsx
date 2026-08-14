import { BookOpen, Sparkles } from 'lucide-react';
import type { ClubBook } from '@/lib/actions/clubs';
import { searchBookMeta } from '@/lib/hardcover';
import { cn } from '@/lib/utils';
import { ReviewBookDialog } from './review-book-dialog';
import { FinishBookButton } from './finish-book-button';
import { ContentWarnings } from './content-warnings';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Rating } from '@/components/ui/rating';
import { Chip } from '@/components/app/chip';
import { Pepper } from '@/components/icons/pepper';
import { Divider } from '@/components/app/divider';

// TODO: spice, series, club rating, and tropes have no data source yet — these
// are placeholders. Genre / page count / global rating come from Google Books.
const PLACEHOLDER_SPICE = 4;
const PLACEHOLDER_SERIES = 'Series #1';
const PLACEHOLDER_CLUB_RATING = 4.5;
const PLACEHOLDER_TROPES = [
  'Enemies to Lovers',
  'Fae',
  'Slow Burn',
  'Forced Proximity',
];

function SpiceMeter({ value }: { value: number }) {
  return (
    <div
      className='flex items-center gap-0.5'
      aria-label={`Spice ${value} of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Pepper
          key={i}
          className={cn(
            'size-5',
            i < value ? 'text-rust' : 'text-foreground/15'
          )}
        />
      ))}
    </div>
  );
}

function StatBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <Typography
        variant='caption'
        classNames='text-muted-foreground'
      >
        {label}
      </Typography>
      {children}
    </div>
  );
}

export async function CurrentlyReading({
  clubId,
  book,
  isAdmin,
}: {
  clubId: string;
  book: ClubBook | null;
  isAdmin: boolean;
}) {
  if (!book) {
    return (
      <div className='flex w-full items-start gap-sm rounded-md border border-dashed border-primary/40 bg-primary/5 p-md text-sm'>
        <Sparkles className='mt-0.5 size-5 shrink-0 text-primary' />
        <div>
          <Typography
            variant='p2'
            classNames='font-medium'
          >
            No book picked yet.
          </Typography>
          <Typography
            variant='p2'
            color='muted'
          >
            The club needs to pick its next read from the nominations.
          </Typography>
        </div>
      </div>
    );
  }

  const meta = await searchBookMeta(book.title, book.author);
  const cover = meta?.cover || book.cover || null;

  const subline = [
    book.author,
    meta?.genre,
    meta?.series ?? PLACEHOLDER_SERIES,
    meta?.pageCount ? `${meta.pageCount} pages` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Real "tropes" from Hardcover moods/genres; fall back to placeholders.
  const tropeSource = meta?.moods.length ? meta.moods : meta?.genres ?? [];
  const tropes = tropeSource.length
    ? tropeSource.slice(0, 5)
    : PLACEHOLDER_TROPES;

  return (
    <div className='card-gradient card-shadow relative flex w-full gap-lg rounded-md border border-accent/40 bg-card/40 p-md'>
      {isAdmin && (
        <div className='absolute right-md top-md'>
          <FinishBookButton clubId={clubId} />
        </div>
      )}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={book.title}
          className='h-[300px] w-[200px] shrink-0 rounded-md object-cover shadow-sm'
        />
      ) : (
        <div className='flex h-[300px] w-[200px] shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
          <BookOpen className='size-10' />
        </div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <Typography
            variant='caption'
            classNames='text-accent-dark dark:text-accent-light'
          >
            Currently reading
          </Typography>
          <Typography
            variant='h2'
            display
            classNames='!mb-0 leading-tight'
          >
            {book.title}
          </Typography>
          {subline && (
            <Typography
              variant='p2'
              classNames='text-muted-foreground'
            >
              {subline}
            </Typography>
          )}
        </div>

        <Divider classNames='my-md' />

        <div className='flex flex-wrap items-end gap-8'>
          <StatBlock label='Spice'>
            <SpiceMeter value={PLACEHOLDER_SPICE} />
          </StatBlock>
          <StatBlock label='Club rating'>
            <Rating
              rate={PLACEHOLDER_CLUB_RATING}
              showScore
            />
          </StatBlock>
          <StatBlock label='Global rating'>
            {meta?.averageRating ? (
              <Rating
                rate={meta.averageRating}
                showScore
              />
            ) : (
              <Typography
                variant='p2'
                classNames='text-muted-foreground'
              >
                Not rated
              </Typography>
            )}
          </StatBlock>
        </div>

        <Divider classNames='my-md' />

        <div className='flex flex-wrap gap-1.5'>
          {tropes.map((trope) => (
            <Chip
              key={trope}
              label={trope}
              size='small'
              variant='painted'
              colors='wine'
            />
          ))}
        </div>

        <div className='mt-auto flex items-center gap-3'>
          <Button
            asChild
            size='sm'
          >
            <a
              href={
                meta?.slug
                  ? `https://hardcover.app/books/${meta.slug}`
                  : `https://hardcover.app/search?q=${encodeURIComponent(book.title)}`
              }
              target='_blank'
              rel='noopener noreferrer'
            >
              <BookOpen className='size-4' /> Get a copy
            </a>
          </Button>
          <ReviewBookDialog
            bookId={book.bookId}
            title={book.title}
          />
          <ContentWarnings warnings={meta?.contentWarnings ?? []} />
        </div>
      </div>
    </div>
  );
}
