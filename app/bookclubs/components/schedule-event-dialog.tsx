'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scheduleEvent } from '@/lib/actions/clubs';

const LABEL =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export function ScheduleEventDialog({
  clubId,
  hasEvent,
}: {
  clubId: string;
  hasEvent: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length > 0 && startsAt.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await scheduleEvent(clubId, {
        title,
        location,
        // datetime-local has no timezone; new Date() reads it as local time.
        startsAt: new Date(startsAt),
      });
      toast.success('Event scheduled');
      setOpen(false);
      setTitle('');
      setLocation('');
      setStartsAt('');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not schedule event'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>Title</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. Chapters 1–10 discussion'
          autoFocus
        />
      </label>

      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>Date &amp; time</span>
        <Input
          type='datetime-local'
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </label>

      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>Location</span>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder='Zoom link, address, or “TBD”'
        />
      </label>

      <Button
        type='submit'
        disabled={!canSubmit}
      >
        Schedule event
      </Button>
    </form>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          size='sm'
          className='w-full'
        >
          <CalendarPlus /> {hasEvent ? 'Schedule another' : 'Schedule an event'}
        </Button>
      }
      title='Schedule an event'
      description='Set up the next time your club gets together.'
      content={content}
    />
  );
}
