import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getCurrentlyReading } from '@/lib/actions/home';
import { getBookMeta } from '@/lib/google-books';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { FinishReadingButton } from './finish-reading-button';

export async function MyReading() {
  const items = await getCurrentlyReading();

  // Resolve well-known covers (stored club covers are often empty).
  const withCovers = await Promise.all(
    items.map(async (item) => ({
      item,
      cover: (await getBookMeta(item.bookId))?.cover || item.cover || null,
    }))
  );

  return (
    <Card
      shadow
      className='w-full gap-3'
      cornerDecoration='all'
    >
      <div className='flex items-center gap-2'>
        <BookOpen className='size-5 text-primary' />
        <Typography
          variant='h4'
          classNames='!mb-0 text-primary'
        >
          Currently reading
        </Typography>
      </div>

      {withCovers.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          Nothing on your shelf right now.
        </p>
      ) : (
        <div className='flex flex-wrap gap-4'>
          {withCovers.map(({ item, cover }) => {
            const content = (
              <>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={item.title}
                    className='h-40 w-28 rounded-md object-cover shadow-sm'
                  />
                ) : (
                  <div className='flex h-40 w-28 items-center justify-center rounded-md bg-muted text-muted-foreground'>
                    <BookOpen className='size-6' />
                  </div>
                )}
                <span className='truncate text-xs font-medium group-hover:text-primary'>
                  {item.title}
                </span>
                <span className='truncate text-[11px] text-muted-foreground'>
                  {item.subtitle}
                </span>
              </>
            );
            return (
              <div
                key={item.key}
                className='group relative flex w-28 flex-col'
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className='flex flex-col gap-1.5'
                  >
                    {content}
                  </Link>
                ) : (
                  <div className='flex flex-col gap-1.5'>{content}</div>
                )}
                <FinishReadingButton
                  clubId={item.clubId}
                  bookId={item.bookId}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
