import { BookOpen, Star } from 'lucide-react';
import { Pepper } from '@/components/icons/pepper';
import { Rating } from '@/components/ui/rating';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { CompletedBook } from '@/lib/actions/home';

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

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

// Dash for anything we don't have a value for.
function Empty() {
  return <span className='text-muted-foreground'>—</span>;
}

const HEADERS = [
  'Cover',
  'Title',
  'Author',
  'Your rating',
  'Overall',
  'Your spice',
  'Club spice',
  'Finished',
  'Club read',
];

export function CompletedBooksTable({ books }: { books: CompletedBook[] }) {
  if (books.length === 0) {
    return (
      <Typography
        variant='p2'
        color='muted'
        classNames='py-md'
      >
        No completed books yet. Mark a book finished and it&apos;ll show up here.
      </Typography>
    );
  }

  return (
    <div className='overflow-x-auto rounded-md border border-foreground/10'>
      <table className='w-full border-collapse text-left text-sm'>
        <thead>
          <tr className='border-b border-foreground/10 bg-foreground/[0.03]'>
            {HEADERS.map((h) => (
              <th
                key={h}
                className='px-3 py-2 font-medium whitespace-nowrap text-muted-foreground'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr
              key={b.bookId}
              className='border-b border-foreground/5 last:border-0'
            >
              <td className='px-3 py-2'>
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.cover}
                    alt={b.title}
                    className='h-16 w-11 shrink-0 rounded object-cover shadow-sm'
                  />
                ) : (
                  <div className='flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground'>
                    <BookOpen className='size-5' />
                  </div>
                )}
              </td>
              <td className='px-3 py-2 font-medium'>{b.title}</td>
              <td className='px-3 py-2 whitespace-nowrap text-muted-foreground'>
                {b.author ?? <Empty />}
              </td>
              <td className='px-3 py-2'>
                {b.userRating ? (
                  <Rating
                    rate={b.userRating}
                    className='[&_svg]:size-4 [&>div]:size-4'
                  />
                ) : (
                  <Empty />
                )}
              </td>
              <td className='px-3 py-2'>
                {b.overallRating ? (
                  <span className='inline-flex items-center gap-1 whitespace-nowrap'>
                    <Star className='size-3.5 fill-foreground stroke-foreground' />
                    {b.overallRating.toFixed(1)}
                  </span>
                ) : (
                  <Empty />
                )}
              </td>
              <td className='px-3 py-2'>
                {b.userSpice ? <SpiceMeter value={b.userSpice} /> : <Empty />}
              </td>
              <td className='px-3 py-2 whitespace-nowrap text-muted-foreground'>
                {b.clubSpice ? (
                  <SpiceMeter value={b.clubSpice} />
                ) : (
                  'n/a'
                )}
              </td>
              <td className='px-3 py-2 whitespace-nowrap text-muted-foreground'>
                {dateFmt.format(b.finishedAt)}
              </td>
              <td className='px-3 py-2 whitespace-nowrap'>
                {b.clubName ?? (
                  <span className='text-muted-foreground'>n/a</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
