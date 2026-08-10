'use client';

import { CalendarClock, CalendarPlus, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ClubEvent } from '@/lib/actions/clubs';
import { ScheduleEventDialog } from './schedule-event-dialog';
import { EventRsvp } from './event-rsvp';
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

function NextEventCard({ events, totalCount, isMember }: NextEventCardProps) {
  const [next, following] = events;
  const moreCount = totalCount - events.length;

  return (
    <Card
      shadow
      cornerDecoration='top-right'
      className='flex flex-col gap-sm'
    >
      {next ? (
        <>
          <p className='font-heading text-lg font-semibold leading-tight'>
            {next.title}
          </p>
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
        </>
      ) : (
        <p className='text-sm text-muted-foreground'>
          No upcoming events scheduled.
        </p>
      )}
    </Card>
  );
}

export function NextEventPanel({
  isAdmin,
  clubId,
  events,
  totalCount,
  isMember,
}: NextEventPanelProps) {
  const [next] = events;

  return (
    <div className='flex flex-col gap-2'>
      <NextEventCard
        events={events}
        totalCount={totalCount}
        isMember={isMember}
      />
      {isAdmin && (
        <div className='pt-xs'>
          <ScheduleEventDialog
            clubId={clubId}
            hasEvent={next != null}
          />
        </div>
      )}
    </div>
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

// Builds a Google Calendar "template" link that opens a pre-filled event in the user's own Google calendar
const EVENT_DEFAULT_MS = 60 * 60 * 1000;

function googleCalendarUrl(event: ClubEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + EVENT_DEFAULT_MS);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function shortDate(startsAt: Date): string {
  return new Date(startsAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function relativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const days = Math.round(diffMs / 86_400_000);
  const hours = Math.round(diffMs / 3_600_000);
  const mins = Math.round(diffMs / 60_000);
  if (Math.abs(days) >= 1) return rtf.format(days, 'day');
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
  return rtf.format(mins, 'minute');
}
