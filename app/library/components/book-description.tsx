'use client';

import type { GoogleBook } from '@/lib/types/books';
import { Dialog } from '@/components/app/dialog';
import { Chip } from '@/components/app/chip';
import { BookCoverImage } from './book-cover-image';
import { Button } from '@/components/ui/button';

// Google Books descriptions arrive as light HTML (<p>, <br>, <i>, entities).
// We never render it as markup — convert to plain text, keeping paragraph
// breaks so the full description in the dialog stays readable.
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isbnOf(book: GoogleBook): string | undefined {
  const ids = book.volumeInfo.industryIdentifiers;
  return (
    ids?.find((i) => i.type === 'ISBN_13')?.identifier ??
    ids?.find((i) => i.type === 'ISBN_10')?.identifier
  );
}

export function BookDescription({ book }: { book: GoogleBook }) {
  const { title, authors, description, categories, pageCount, publishedDate } =
    book.volumeInfo;

  if (!description) return null;

  const text = htmlToText(description);
  const author = authors?.join(', ');
  const thumbnail = book.volumeInfo.imageLinks?.thumbnail?.replace(
    'http://',
    'https://'
  );
  const year = publishedDate?.slice(0, 4);

  const details = (
    <div className='flow-root'>
      <div className='relative float-left mr-4 mb-3 aspect-[2/3] w-40 overflow-hidden rounded-md border border-ink'>
        <div className='flex h-full w-full items-center justify-center bg-muted p-2 text-center text-[10px] font-display text-muted-foreground'>
          {title}
        </div>
        <BookCoverImage
          title={title}
          author={author}
          isbn={isbnOf(book)}
          fallback={thumbnail}
          alt={title}
          className='absolute inset-0 h-full w-full object-cover'
        />
      </div>

      <p className='whitespace-pre-line text-sm leading-relaxed text-foreground/90'>
        {text}
      </p>
    </div>
  );

  const chips = (
    <div className='flex flex-wrap items-center gap-1.5'>
      {categories?.[0] && (
        <Chip
          label={categories[0]}
          size='small'
          variant='painted'
          colors='sapphire'
        />
      )}
      {year && (
        <Chip
          label={year}
          size='small'
          variant='outline'
          colors='ink'
        />
      )}
      {pageCount && (
        <Chip
          label={`${pageCount} pg`}
          size='small'
          variant='outline'
          colors='secondary'
        />
      )}
    </div>
  );

  return (
    <div className='flex flex-col items-start gap-0.5'>
      <p className='line-clamp-2 text-xs leading-snug text-muted-foreground'>
        {text.replace(/\n+/g, ' ')}
      </p>

      <Dialog
        trigger={
          <Button
            variant='link'
            size='xs'
            className='text-xs font-medium text-primary hover:underline p-0'
          >
            More
          </Button>
        }
        title={title}
        description={author ?? 'Unknown author'}
        content={details}
        footer={chips}
        className='h-[65vh]'
      />
    </div>
  );
}
