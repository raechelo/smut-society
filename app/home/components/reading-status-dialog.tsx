'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Typography from '@/components/ui/typography';
import { Pepper } from '@/components/icons/pepper';
import { saveReadingUpdate, type ReadStatus } from '@/lib/actions/home';
import { cn } from '@/lib/utils';

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <Button
          key={n}
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            className={cn(
              'size-6',
              n <= active
                ? 'fill-foreground stroke-foreground'
                : 'fill-foreground/10 stroke-foreground/25'
            )}
          />
        </Button>
      ))}
    </div>
  );
}

function SpicePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <Button
          key={n}
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label={`${n} pepper${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
        >
          <Pepper
            className={cn(
              'size-6',
              n <= active ? 'text-rust' : 'text-foreground/25'
            )}
          />
        </Button>
      ))}
    </div>
  );
}

const STATUS_LABELS: Record<ReadStatus, string> = {
  'in progress': 'In progress',
  completed: 'Completed',
  dnf: 'Did not finish',
};

// The ISO strings from the server carry a full timestamp; <input type="date">
// wants a bare YYYY-MM-DD.
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export function ReadingStatusDialog({
  bookId,
  clubId,
  title,
  initialRating,
  initialSpice,
  initialStatus,
  initialStartedAt,
  initialFinishedAt,
}: {
  bookId: string;
  clubId: string | null;
  title: string;
  initialRating: number | null;
  initialSpice: number | null;
  initialStatus: ReadStatus;
  initialStartedAt: string | null;
  initialFinishedAt: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialRating ?? 0);
  const [spice, setSpice] = useState(initialSpice ?? 0);
  const [status, setStatus] = useState<ReadStatus>(initialStatus);
  const [startedAt, setStartedAt] = useState(toDateInput(initialStartedAt));
  const [endedAt, setEndedAt] = useState(toDateInput(initialFinishedAt));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveReadingUpdate({
        bookId,
        clubId,
        status,
        rating,
        spice,
        startedAt: startedAt || null,
        endedAt: endedAt || null,
      });
      toast.success('Reading updated');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update this book'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size='icon-xs'
          aria-label='Update reading status'
          onClick={(e) => {
            // Keep the click off the surrounding card/link. NB: don't
            // preventDefault here — Radix's DialogTrigger checks
            // defaultPrevented and would skip opening the dialog.
            e.stopPropagation();
          }}
          className='absolute right-1 top-1 rounded-full opacity-0 shadow transition-opacity focus-visible:opacity-100 group-hover:opacity-100'
        >
          <Check className='size-3.5' />
        </Button>
      </DialogTrigger>

      {/* Only the X and Save close this: block outside-click and Escape. */}
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Update your reading</DialogTitle>
          <DialogDescription>
            Track and review {title} — you don&apos;t have to finish it first.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <Typography
              variant='caption'
              color='muted'
              classNames='text-xs font-medium'
            >
              Status
            </Typography>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ReadStatus)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ['in progress', 'completed', 'dnf'] as const
                ).map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                  >
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Typography
              variant='caption'
              color='muted'
              classNames='text-xs font-medium'
            >
              Rating
            </Typography>
            <StarPicker
              value={rating}
              onChange={setRating}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Typography
              variant='caption'
              color='muted'
              classNames='text-xs font-medium'
            >
              Spice
            </Typography>
            <SpicePicker
              value={spice}
              onChange={setSpice}
            />
          </div>

          <div className='flex gap-3'>
            <label className='flex flex-1 flex-col gap-1.5'>
              <Typography
                variant='caption'
                color='muted'
                classNames='text-xs font-medium'
              >
                Started
              </Typography>
              <Input
                type='date'
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </label>
            <label className='flex flex-1 flex-col gap-1.5'>
              <Typography
                variant='caption'
                color='muted'
                classNames='text-xs font-medium'
              >
                {status === 'dnf' ? 'Stopped' : 'Finished'}
              </Typography>
              <Input
                type='date'
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
                disabled={status === 'in progress'}
              />
            </label>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
