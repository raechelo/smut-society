'use client';

import { CalendarPlus, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ClubEvent } from '@/lib/actions/clubs';
import { EventRsvp } from './event-rsvp';
import { googleCalendarUrl, relativeTime, shortDate } from '../utils';
import Typography from '@/components/ui/typography';

type NextEventPanelProps = {
  clubId: string;
  events: ClubEvent[];
  totalCount: number;
  isMember: boolean;
  isAdmin: boolean;
};

type NextEventCardProps = {
  events: ClubEvent[];
  totalCount: number;
  isMember: boolean;
};

export function NextEvent({
  events,
  totalCount,
  isMember,
}: NextEventCardProps) {
  const [next, following] = events;
  const moreCount = totalCount - events.length;

  return (
    <Card
      shadow
      cornerDecoration='top-right'
      className='flex gap-sm'
    >
      <Typography variant='h3'>{next.title}</Typography>
      <EventWhen startsAt={next.startsAt} />
      {next.location && (
        <p className='flex items-start gap-1.5 text-sm text-muted-foreground'>
          <MapPin className='mt-0.5 size-4 shrink-0' />
          <span className='min-w-0 break-words'>{next.location}</span>
        </p>
      )}

      <EventRsvp
        eventId={next.id}
        attendingCount={next.attendingCount}
        myRsvp={next.myRsvp}
        canRsvp={isMember}
      />

      <a
        href={googleCalendarUrl(next)}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline'
      >
        <CalendarPlus className='size-4' />
        Add to Google Calendar
      </a>

      {following && (
        <ul className='mt-xs list-disc border-t border-border/40 pl-4 pt-sm text-sm text-muted-foreground marker:text-primary/60'>
          <li>
            <span className='font-medium text-foreground'>
              {following.title}
            </span>{' '}
            &middot;{' '}
            <span suppressHydrationWarning>
              {shortDate(following.startsAt)}
            </span>
          </li>
        </ul>
      )}

      {moreCount > 0 && (
        <p className='text-xs text-muted-foreground'>
          +{moreCount} more scheduled
        </p>
      )}
    </Card>
  );
}

// Formatted with the viewer's locale/timezone. suppressHydrationWarning covers
// the expected server↔browser difference (server TZ vs. the user's).
function EventWhen({ startsAt }: { startsAt: Date }) {
  const date = new Date(startsAt);
  const abs = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div>
      <p
        className='text-sm font-medium'
        suppressHydrationWarning
      >
        {abs}
      </p>
      <p
        className='text-xs text-primary'
        suppressHydrationWarning
      >
        {relativeTime(date)}
      </p>
    </div>
  );
}
