import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Full-width horizontal club card for the My Bookclubs list. The whole card is
// no longer a link; navigation happens through the "View more" button.
export function MyClubCard({
  id,
  name,
  description,
  memberCount,
  upcomingEventCount,
  badges,
}: {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  upcomingEventCount: number;
  badges?: ReactNode;
}) {
  return (
    <Card
      cornerDecoration='diagonal'
      className='w-full flex-row items-center gap-md'
    >
      <div className='flex min-w-0 flex-1 flex-col gap-sm'>
        <div className='flex flex-wrap items-center gap-sm'>
          <h3 className='font-heading text-lg font-semibold tracking-wide'>
            {name}
          </h3>
          {badges ? (
            <div className='flex flex-wrap gap-xs'>{badges}</div>
          ) : null}
        </div>

        {description ? (
          <p className='line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground'>
            {description}
          </p>
        ) : (
          <p className='text-sm italic text-muted-foreground/70'>
            No description yet.
          </p>
        )}

        <div className='flex flex-wrap items-center gap-md text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <Users className='size-3.5' />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className='flex items-center gap-1.5'>
            <CalendarClock className='size-3.5' />
            {upcomingEventCount} upcoming{' '}
            {upcomingEventCount === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      <Link
        href={`/bookclubs/${id}`}
        className='shrink-0'
      >
        <Button variant='outline'>
          View more <ArrowRight />
        </Button>
      </Link>
    </Card>
  );
}
