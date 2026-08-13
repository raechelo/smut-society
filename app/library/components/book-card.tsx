import { BookOpen } from 'lucide-react';
import { Card, CardFooter } from '@/components/ui/card';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import type { HardcoverBook } from '@/lib/hardcover';
import { BookCardActions } from './book-card-actions';
import { BookDescription } from './book-description';

type InfoChip = {
  label: string;
  variant: 'outline' | 'filled' | 'painted';
  colors:
    | 'primary'
    | 'secondary'
    | 'wine'
    | 'ink'
    | 'sapphire'
    | 'sienna'
    | 'rust';
};

function getInfoChips(book: HardcoverBook): InfoChip[] {
  const chips: InfoChip[] = [];

  if (book.genres[0]) {
    chips.push({ label: book.genres[0], variant: 'painted', colors: 'sapphire' });
  }
  if (book.series) {
    chips.push({ label: book.series, variant: 'filled', colors: 'primary' });
  }
  if (book.pages) {
    chips.push({
      label: `${book.pages} pg`,
      variant: 'outline',
      colors: 'secondary',
    });
  }
  if (book.rating) {
    const label = book.ratingsCount
      ? `★ ${book.rating.toFixed(2)} (${book.ratingsCount.toLocaleString()})`
      : `★ ${book.rating.toFixed(2)}`;
    chips.push({ label, variant: 'painted', colors: 'sienna' });
  }

  return chips;
}

type BookCardProps = {
  book: HardcoverBook;
  isFavorited?: boolean;
  onFavoriteChange?: (bookId: string, favorited: boolean) => void;
  isOnShelf?: boolean;
  onShelfChange?: (bookId: string, onShelf: boolean) => void;
};

export function BookCard({
  book,
  isFavorited = false,
  onFavoriteChange,
  isOnShelf = false,
  onShelfChange,
}: BookCardProps) {
  const author = book.authors.join(', ');
  const chips = getInfoChips(book);

  return (
    <Card
      shadow
      className='h-full p-0'
      cornerDecoration='diagonal'
    >
      <BookCardActions
        book={book}
        isFavorited={isFavorited}
        onFavoriteChange={onFavoriteChange}
        isOnShelf={isOnShelf}
        onShelfChange={onShelfChange}
      />

      {/* Cover (left) + Details (right) */}
      <div className='flex min-h-[200px] flex-1 gap-sm p-sm'>
        <div className='relative w-[35%] shrink-0 overflow-hidden rounded-[8px] border border-ink'>
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt={book.title}
              className='absolute inset-0 h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground'>
              <BookOpen className='size-6' />
            </div>
          )}
        </div>

        {/* Details — remaining 65% */}
        <div className='flex flex-1 flex-col gap-sm py-sm pr-sm'>
          <Typography
            variant='p2'
            classNames='line-clamp-3 font-semibold leading-snug'
          >
            {book.title}
          </Typography>
          {author && (
            <Typography
              variant='span'
              color='muted'
              classNames='line-clamp-2 italic'
            >
              {author}
            </Typography>
          )}
          <BookDescription book={book} />
        </div>
      </div>

      {/* Footer — info chips */}
      {chips.length > 0 && (
        <CardFooter className='flex-wrap gap-xs border-t border-border/30 pt-md pb-sm py-xs'>
          {chips.map((chip, i) => (
            <Chip
              key={i}
              label={chip.label}
              size='small'
              variant={chip.variant}
              colors={chip.colors}
            />
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
