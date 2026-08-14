'use client';

import { BookOpen } from 'lucide-react';
import type { HardcoverBook } from '@/lib/hardcover';
import { Dialog } from '@/components/app/dialog';
import { Chip } from '@/components/app/chip';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';

// Descriptions can arrive with light HTML (<p>, <br>, <i>, entities). We never
// render it as markup — convert to plain text, keeping paragraph breaks.
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

export function BookDescription({ book }: { book: HardcoverBook }) {
  if (!book.description) return null;

  const text = htmlToText(book.description);
  const author = book.authors.join(', ');

  const details = (
    <div className='flow-root'>
      <div className='relative float-left mr-4 mb-3 aspect-[2/3] w-40 overflow-hidden rounded-md border border-ink'>
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

      <Typography
        variant='p2'
        classNames='whitespace-pre-line leading-relaxed text-foreground/90'
      >
        {text}
      </Typography>
    </div>
  );

  const chips = (
    <div className='flex flex-wrap items-center gap-1.5'>
      {book.genres[0] && (
        <Chip
          label={book.genres[0]}
          size='small'
          variant='painted'
          colors='sapphire'
        />
      )}
      {book.releaseYear && (
        <Chip
          label={String(book.releaseYear)}
          size='small'
          variant='outline'
          colors='ink'
        />
      )}
      {book.pages && (
        <Chip
          label={`${book.pages} pg`}
          size='small'
          variant='outline'
          colors='secondary'
        />
      )}
    </div>
  );

  return (
    <div className='flex flex-col items-start gap-0.5'>
      <Typography
        variant='p2'
        color='muted'
        classNames='line-clamp-2 text-xs leading-snug'
      >
        {text.replace(/\n+/g, ' ')}
      </Typography>

      <Dialog
        trigger={
          <Button
            variant='link'
            size='xs'
            className='p-0'
          >
            More
          </Button>
        }
        title={book.title}
        description={author || 'Unknown author'}
        content={details}
        footer={chips}
        className='h-[65vh]'
      />
    </div>
  );
}
