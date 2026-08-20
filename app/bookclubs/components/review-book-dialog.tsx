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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import Typography from '@/components/ui/typography';
import { Pepper } from '@/components/icons/pepper';
import { saveBookReview } from '@/lib/actions/home';
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
          onClick={() => onChange(n)}
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

export function ReviewBookDialog({
  bookId,
  title,
}: {
  bookId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [spice, setSpice] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBookReview(bookId, rating, spice, text);
      toast.success('Review saved');
      setOpen(false);
    } catch {
      toast.error('Could not save your review. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size='icon-sm'
              variant='outline'
              color='secondary'
              aria-label='Review this book'
            >
              <PenLine className='size-4' />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Review this book</TooltipContent>
      </Tooltip>

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

          <label className='flex flex-col gap-1.5'>
            <Typography
              variant='caption'
              color='muted'
              classNames='text-xs font-medium'
            >
              Your review
            </Typography>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder='What did you think?'
            />
          </label>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save review'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
