'use client';

import { useState } from 'react';
import { PenLine, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LABEL = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

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
          onClick={() => onChange(n)}
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

export function ReviewBookDialog({
  bookId,
  title,
}: {
  bookId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const handleSave = () => {
    // TODO: persist the review — no reviews backend yet. bookId is captured so
    // it can be wired up once the model exists.
    void bookId;
    toast.success('Review saved');
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          size='sm'
          color='accent'
          className='mt-1 w-fit'
        >
          <PenLine className='size-4' /> Review this book
        </Button>
      </DialogTrigger>

      {/* Only the X and Save close this: block outside-click and Escape. */}
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Review this book</DialogTitle>
          <DialogDescription>Share your thoughts on {title}.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <span className={LABEL}>Rating</span>
            <StarPicker
              value={rating}
              onChange={setRating}
            />
          </div>

          <label className='flex flex-col gap-1.5'>
            <span className={LABEL}>Your review</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder='What did you think?'
              className='w-full resize-none rounded-md border border-primary bg-transparent p-sm text-sm outline-none transition-colors hover:border-accent-dark focus-visible:border-ring dark:hover:border-accent-light'
            />
          </label>
        </div>

        <Button onClick={handleSave}>Save review</Button>
      </DialogContent>
    </Dialog>
  );
}
