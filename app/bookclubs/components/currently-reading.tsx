import { BookOpen, Sparkles, TriangleAlert } from 'lucide-react';
import type { ClubBook } from '@/lib/actions/clubs';
import { getBookMeta } from '@/lib/google-books';
import { cn } from '@/lib/utils';
import { FinishBookButton } from './finish-book-button';
import { ReviewBookDialog } from './review-book-dialog';
import Typography from '@/components/ui/typography';
import { Rating } from '@/components/ui/rating';
import { Chip } from '@/components/app/chip';
import { Divider } from '@/components/app/divider';
import { Pepper } from '@/components/icons/pepper';

// TODO: spice, tropes, and content warnings have no data source yet — these are
// placeholders until we add real fields. Genre / page count / rating come from
// Google Books (see getBookMeta).
const PLACEHOLDER_SPICE = 4;
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
          className={cn('size-4', i < value ? 'text-rust' : 'text-foreground/15')}
        />
      ))}
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
      <div className='flex items-start gap-sm rounded-md border border-dashed border-primary/40 bg-primary/5 p-md text-sm'>
        <Sparkles className='mt-0.5 size-5 shrink-0 text-primary' />
        <div>
          <p className='font-medium text-foreground'>No book picked yet.</p>
          <p className='text-muted-foreground'>
            {isAdmin
              ? 'Pick the club’s next read from the nominations in the sidebar.'
              : 'The club needs to pick its next read from the nominations in the sidebar.'}
          </p>
        </div>
      </div>
    );
  }

  const meta = await getBookMeta(book.bookId);
  const cover = meta?.cover || book.cover || null;

  const subline = [
    book.author,
    meta?.genre,
    meta?.pageCount ? `${meta.pageCount} pages` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className='flex gap-md rounded-md border border-border bg-card/40 p-[12px]'>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={book.title}
          className='h-[225px] w-[150px] shrink-0 rounded-sm object-cover shadow-sm'
        />
      ) : (
        <div className='flex h-[225px] w-[150px] shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground'>
          <BookOpen className='size-8' />
        </div>
      )}

      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div>
          <span className='text-xs font-semibold uppercase tracking-wider text-accent-dark dark:text-accent-light'>
            Currently reading
          </span>
          <Typography variant='h4'>{book.title}</Typography>
          {subline && (
            <p className='text-sm text-muted-foreground'>{subline}</p>
          )}
        </div>

        <Divider />

        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-2'>
            <span className='w-14 text-sm text-muted-foreground'>Spice</span>
            <SpiceMeter value={PLACEHOLDER_SPICE} />
          </div>
          <div className='flex items-center gap-2'>
            <span className='w-14 text-sm text-muted-foreground'>Rating</span>
            {meta?.averageRating ? (
              <Rating
                rate={meta.averageRating}
                showScore
              />
            ) : (
              <span className='text-sm text-muted-foreground'>Not rated</span>
            )}
          </div>
        </div>

        <Divider />

        <div className='flex flex-wrap gap-1.5'>
          {PLACEHOLDER_TROPES.map((trope) => (
            <Chip
              key={trope}
              label={trope}
              size='small'
              variant='painted'
              colors='wine'
            />
          ))}
        </div>

        <div className='mt-1 flex items-center gap-3 text-sm'>
          {/* TODO: wire real content warnings — placeholder trigger for now. */}
          <button
            type='button'
            className='inline-flex items-center gap-1 font-medium text-secondary hover:underline dark:text-secondary-foreground'
          >
            <TriangleAlert className='size-4' /> Content warnings
          </button>
          <span className='text-muted-foreground'>·</span>
          <a
            href={`https://books.google.com/books?id=${book.bookId}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 font-medium text-primary hover:underline'
          >
            <BookOpen className='size-4' /> Get a copy
          </a>
        </div>

        <ReviewBookDialog
          bookId={book.bookId}
          title={book.title}
        />
      </div>

      {isAdmin && (
        <div className='self-start'>
          <FinishBookButton clubId={clubId} />
        </div>
      )}
    </div>
  );
}
