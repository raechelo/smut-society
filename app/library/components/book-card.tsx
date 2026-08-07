import { Card, CardFooter } from '@/components/ui/card';
import { Chip } from '@/components/app/chip';
import type { GoogleBook } from '@/lib/types/books';
import { BookmarkButton } from './bookmark-button';
import { BookCoverImage } from './book-cover-image';

function detectSeries(title: string): boolean {
  return (
    /#\d+/.test(title) ||
    /\bbook\s+\d+\b/i.test(title) ||
    /\bvol(ume)?\.?\s*\d+\b/i.test(title) ||
    /\bpart\s+\d+\b/i.test(title) ||
    /\(\w[^)]*#\d+\)/.test(title)
  );
}

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

function getInfoChips(book: GoogleBook): InfoChip[] {
  const { title, pageCount, averageRating, ratingsCount, categories } =
    book.volumeInfo;
  const chips: InfoChip[] = [];

  if (categories?.[0]) {
    chips.push({
      label: categories[0],
      variant: 'painted',
      colors: 'sapphire',
    });
  }

  if (detectSeries(title)) {
    chips.push({ label: 'In a Series', variant: 'filled', colors: 'primary' });
  }

  if (pageCount) {
    chips.push({
      label: `${pageCount} pg`,
      variant: 'outline',
      colors: 'secondary',
    });
  }

  if (averageRating) {
    const label = ratingsCount
      ? `★ ${averageRating} (${ratingsCount.toLocaleString()})`
      : `★ ${averageRating}`;
    chips.push({ label, variant: 'painted', colors: 'sienna' });
  }

  return chips;
}

const PLACEHOLDER =
  'flex h-full w-full items-center justify-center bg-muted p-sm text-center text-xs text-muted-foreground';

type BookCardProps = {
  book: GoogleBook;
  isFavorited?: boolean;
  onFavoriteChange?: (bookId: string, favorited: boolean) => void;
};

export function BookCard({
  book,
  isFavorited = false,
  onFavoriteChange,
}: BookCardProps) {
  const { title, authors, imageLinks, industryIdentifiers } = book.volumeInfo;
  const thumbnail = imageLinks?.thumbnail?.replace('http://', 'https://');
  const author = authors?.join(', ');
  const isbn =
    industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ??
    industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier;
  const chips = getInfoChips(book);

  return (
    <Card className='h-full p-0' cornerDecoration='diagonal'>
      <BookmarkButton
        bookId={book.id}
        isFavorited={isFavorited}
        onFavoriteChange={onFavoriteChange}
      />

      {/* Cover (left) + Details (right) */}
      <div className='flex min-h-[160px] flex-1 gap-sm p-sm'>
        {/* Cover — 30%. Placeholder is the base layer; the cover image overlays
            it when one resolves, so a card is never an empty box. */}
        <div className='relative w-[30%] shrink-0 overflow-hidden rounded-[16px] border border-ink'>
          <div className={PLACEHOLDER}>{title}</div>
          <BookCoverImage
            title={title}
            author={author}
            isbn={isbn}
            fallback={thumbnail}
            alt={title}
            className='absolute inset-0 h-full w-full object-cover'
          />
        </div>

        {/* Details — remaining 70% */}
        <div className='flex flex-1 flex-col gap-sm py-sm pr-sm'>
          <p className='line-clamp-3 text-sm font-semibold leading-snug'>
            {title}
          </p>
          {author && (
            <p className='line-clamp-2 text-xs italic text-muted-foreground'>
              {author}
            </p>
          )}
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
