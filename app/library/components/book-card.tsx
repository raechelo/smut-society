import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Chip } from '@/components/app/chip';
import type { GoogleBook } from '@/lib/types/books';
import { BookCardActions } from './book-card-actions';

const PLACEHOLDER_BG = 'bg-muted flex items-center justify-center';

export function BookCard({ book }: { book: GoogleBook }) {
  const { title, authors, description, imageLinks, categories } =
    book.volumeInfo;
  const thumbnail = imageLinks?.thumbnail?.replace('http://', 'https://');
  const author = authors?.join(', ');
  const category = categories?.[0];

  return (
    <Card className='h-full'>
      <BookCardActions book={book} />
      <div className='aspect-[2/3] w-full overflow-hidden rounded-t-md'>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className='h-full w-full object-cover'
          />
        ) : (
          <div
            className={`h-full w-full ${PLACEHOLDER_BG} p-md text-center text-xs text-muted-foreground`}
          >
            {title}
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className='!text-sm line-clamp-2 leading-snug'>
          {title}
        </CardTitle>
        {author && (
          <CardDescription className='line-clamp-1'>{author}</CardDescription>
        )}
      </CardHeader>
      {(description || category) && (
        <CardContent className='flex flex-col gap-sm'>
          {description && (
            <p className='line-clamp-3 text-xs leading-relaxed text-muted-foreground'>
              {description}
            </p>
          )}
          {category && (
            <Chip
              label={category}
              size='small'
              variant='outline'
              colors='secondary'
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
