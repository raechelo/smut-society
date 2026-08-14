'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { setEventRsvp, type RsvpStatus } from '@/lib/actions/clubs';

export function EventRsvp({
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
    // Clicking the active choice clears the RSVP.
    const next = status === target ? null : target;
    const prevStatus = status;
    const prevCount = count;

    setStatus(next);
    setCount(
      (c) => c + (next === 'going' ? 1 : 0) - (status === 'going' ? 1 : 0)
    );

    startTransition(async () => {
      try {
        await setEventRsvp(eventId, next);
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
    <div className='flex flex-col gap-xs'>
      <Typography
        variant='p2'
        color='muted'
        classNames='text-xs'
      >
        {count} attending
        {status === 'going' && count > 0 && ' · you’re in'}
      </Typography>
      <div className='grid grid-cols-2 gap-xs'>
        <Button
          size='sm'
          variant={status === 'not_going' ? 'solid' : 'outline'}
          color={status === 'not_going' ? 'secondary' : 'primary'}
          onClick={() => apply('not_going')}
        >
          <X className='size-4' />
        </Button>
        <Button
          size='sm'
          variant={status === 'not_going' ? 'outline' : 'solid'}
          onClick={() => apply('going')}
        >
          <Check className='size-4' />
        </Button>
      </div>
    </div>
  );
}
