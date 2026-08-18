import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getCurrentlyReading } from '@/lib/actions/home';
import { searchBookMeta } from '@/lib/hardcover';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { ReadingStatusDialog } from './reading-status-dialog';

export async function MyReading() {
  const items = await getCurrentlyReading();

  // Resolve curated covers from Hardcover (stored covers are often empty).
  const withCovers = await Promise.all(
    items.map(async (item) => ({
      item,
      cover:
        (await searchBookMeta(item.title, item.author))?.cover ||
        item.cover ||
        null,
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
          display
          classNames='!mb-0 text-primary'
        >
          Currently reading
        </Typography>
      </div>

      {withCovers.length === 0 ? (
        <Typography
          variant='p2'
          color='muted'
        >
          Nothing on your shelf right now.
        </Typography>
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
                <Typography
                  variant='span'
                  classNames='truncate font-medium group-hover:text-primary'
                >
                  {item.title}
                </Typography>
                <Typography
                  variant='span'
                  color='muted'
                  classNames='truncate text-[11px]'
                >
                  {item.subtitle}
                </Typography>
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
                <ReadingStatusDialog
                  bookId={item.bookId}
                  clubId={item.clubId}
                  title={item.title}
                  initialRating={item.rating}
                  initialSpice={item.spice}
                  initialStatus={item.status}
                  initialStartedAt={item.startedAt}
                  initialFinishedAt={item.finishedAt}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
