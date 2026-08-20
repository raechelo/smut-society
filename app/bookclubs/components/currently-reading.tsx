import { BookOpen, ShoppingCart, Sparkles } from 'lucide-react';
import type { ClubBook } from '@/lib/actions/clubs';
import { getClubBookAverages } from '@/lib/actions/clubs';
import { searchBookMeta, bookBySlug } from '@/lib/hardcover';
import { cn } from '@/lib/utils';
import { ReviewBookDialog } from './review-book-dialog';
import { FinishBookButton } from './finish-book-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Typography from '@/components/ui/typography';
import { Rating } from '@/components/ui/rating';
import { Chip } from '@/components/app/chip';
import { Pepper } from '@/components/icons/pepper';
import { Hardcover } from '@/components/icons/hardcover';
import { Divider } from '@/components/app/divider';

// Tropes, content warnings, the global rating, and the series come from
// Hardcover (cached_tags / book_series on the books table). Spice and the club
// rating are averaged from this club's members' own reviews.

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

  // Resolve the book on Hardcover: search gets the slug/cover/series, then the
  // books-table row carries the populated cached_tags (moods/tropes/warnings)
  // and the real rating.
  const meta = await searchBookMeta(book.title, book.author);
  const detail = meta?.slug ? await bookBySlug(meta.slug) : null;

  const cover = meta?.cover || detail?.cover || book.cover || null;
  const genre = meta?.genre || detail?.genres?.[0] || null;
  const pageCount = meta?.pageCount || detail?.pages || null;
  const globalRating = detail?.rating ?? meta?.averageRating ?? null;

  // "The Empyrean #1" when we know the position, else just the series name.
  const seriesName = detail?.series ?? meta?.series ?? null;
  const seriesLabel = seriesName
    ? detail?.seriesPosition
      ? `${seriesName} #${detail.seriesPosition}`
      : seriesName
    : null;

  const subline = [
    book.author,
    genre,
    seriesLabel,
    pageCount ? `${pageCount} pages` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // "Tropes" from Hardcover moods (evocative vibes), falling back to genres.
  const moods = detail?.moods?.length ? detail.moods : meta?.moods ?? [];
  const genres = detail?.genres?.length ? detail.genres : meta?.genres ?? [];
  const tropes = (moods.length ? moods : genres).slice(0, 5);

  const contentWarnings =
    detail?.contentWarnings ?? meta?.contentWarnings ?? [];

  // Club spice + rating, averaged over this club's members' own reviews.
  const clubAverages = await getClubBookAverages(clubId, book.bookId);

  const hardcoverUrl = meta?.slug
    ? `https://hardcover.app/books/${meta.slug}`
    : `https://hardcover.app/search?q=${encodeURIComponent(book.title)}`;
  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
    [book.title, book.author].filter(Boolean).join(' ')
  )}`;

  return (
    <Card
      shadow
      className='w-full flex-row gap-lg bg-card'
    >
      <div className='flex shrink-0 flex-col items-center gap-3 self-center'>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={book.title}
            className='h-[330px] w-[220px] rounded-md object-cover shadow-sm'
          />
        ) : (
          <div className='flex h-[330px] w-[220px] items-center justify-center rounded-md bg-muted text-muted-foreground'>
            <BookOpen className='size-10' />
          </div>
        )}

        {/* Compact icon actions live under the cover to save horizontal room. */}
        <div className='flex items-center gap-2'>
          <ReviewBookDialog
            bookId={book.bookId}
            title={book.title}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size='icon-sm'
                variant='outline'
                color='secondary'
              >
                <a
                  href={hardcoverUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='View on Hardcover'
                >
                  <Hardcover className='size-4' />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on Hardcover</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                size='icon-sm'
                variant='outline'
                color='secondary'
              >
                <a
                  href={amazonUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Find on Amazon'
                >
                  <ShoppingCart className='size-4' />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Find on Amazon</TooltipContent>
          </Tooltip>
          {isAdmin && <FinishBookButton clubId={clubId} />}
        </div>
      </div>

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

        <Divider classNames='my-sm' />

        <div className='flex flex-wrap items-end gap-8'>
          <StatBlock label='Spice'>
            {clubAverages.spice != null ? (
              <div className='flex items-center gap-2'>
                <SpiceMeter value={Math.round(clubAverages.spice)} />
                <Typography
                  variant='p2'
                  classNames='text-muted-foreground'
                >
                  {clubAverages.spice.toFixed(1)}
                </Typography>
              </div>
            ) : (
              <Typography
                variant='p2'
                classNames='text-muted-foreground'
              >
                Not rated
              </Typography>
            )}
          </StatBlock>
          <StatBlock label='Club rating'>
            {clubAverages.rating != null ? (
              <Rating
                rate={clubAverages.rating}
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
          <StatBlock label='Global rating'>
            {globalRating ? (
              <Rating
                rate={globalRating}
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

        {(tropes.length > 0 || contentWarnings.length > 0) && (
          <>
            <Divider classNames='my-sm' />
            <div className='flex flex-col gap-4'>
              {tropes.length > 0 && (
                <StatBlock label='Themes'>
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
                </StatBlock>
              )}
              {contentWarnings.length > 0 && (
                <StatBlock label='Warnings'>
                  <div className='flex flex-wrap gap-1.5'>
                    {contentWarnings.map((warning) => (
                      <Chip
                        key={warning}
                        label={warning}
                        size='small'
                        variant='painted'
                        colors='warning'
                        className='capitalize'
                      />
                    ))}
                  </div>
                </StatBlock>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
