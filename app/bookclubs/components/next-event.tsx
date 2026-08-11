'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Typography from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  setEventRsvp,
  type ClubEvent,
  type RsvpStatus,
} from '@/lib/actions/clubs';

type NextEventProps = {
  clubName: string;
  events: ClubEvent[];
  isMember: boolean;
};

const DOT = 'text-sidebar-foreground/40';

export function NextEvent({ clubName, events, isMember }: NextEventProps) {
  const next = events[0] ?? null;

  return (
    <div className='flex h-fit shrink-0 items-center gap-md rounded-md bg-sidebar px-md text-sidebar-foreground z-3'>
      <Typography
        variant='h3'
        classNames='!mb-0 min-w-0 truncate pl-2 leading-[2] text-accent-light'
      >
        {clubName}
      </Typography>

      {next ? (
        <div className='ml-auto flex shrink-0 items-center gap-3 text-sm'>
          <span suppressHydrationWarning>{eventDate(next.startsAt)}</span>
          <span className={DOT}>·</span>
          <span suppressHydrationWarning>{eventTime(next.startsAt)}</span>
          <span className={DOT}>·</span>
          <div className='flex items-center gap-3'>
            <Rsvp
              eventId={next.id}
              attendingCount={next.attendingCount}
              myRsvp={next.myRsvp}
              canRsvp={isMember}
            />
          </div>
        </div>
      ) : (
        <span className='ml-auto text-sm text-sidebar-foreground/70'>
          No upcoming events
        </span>
      )}
    </div>
  );
}

function Rsvp({
  eventId,
  attendingCount,
  myRsvp,
  canRsvp,
}: {
  eventId: string;
  attendingCount: number;
  myRsvp: RsvpStatus | null;
  canRsvp: boolean;
}) {
  const [count, setCount] = useState(attendingCount);
  const [status, setStatus] = useState<RsvpStatus | null>(myRsvp);
  const [, startTransition] = useTransition();

  const apply = (target: RsvpStatus) => {
    if (!canRsvp) {
      toast.error('Join this club to RSVP');
      return;
    }
    const nextStatus = status === target ? null : target;
    const prevStatus = status;
    const prevCount = count;

    setStatus(nextStatus);
    setCount(
      (c) => c + (nextStatus === 'going' ? 1 : 0) - (status === 'going' ? 1 : 0)
    );

    startTransition(async () => {
      try {
        await setEventRsvp(eventId, nextStatus);
      } catch (err) {
        setStatus(prevStatus);
        setCount(prevCount);
        toast.error(
          err instanceof Error ? err.message : 'Could not save your RSVP'
        );
      }
    });
  };

  return (
    <>
      <Typography classNames='whitespace-nowrap'>{count} going</Typography>
      <span className={DOT}>·</span>
      <div className='flex items-center gap-1.5'>
        <Button
          variant='outline'
          color='accent'
          aria-pressed={status === 'not_going'}
          onClick={() => apply('not_going')}
        >
          <X />
        </Button>
        <Button
          variant='solid'
          color='accent'
          aria-pressed={status === 'going'}
          onClick={() => apply('going')}
        >
          <Check />
        </Button>
      </div>
    </>
  );
}

// Formatted with the viewer's locale/timezone; suppressHydrationWarning covers
// the expected server↔browser difference (server TZ vs. the user's).
function eventDate(startsAt: Date): string {
  return new Date(startsAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function eventTime(startsAt: Date): string {
  return new Date(startsAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
