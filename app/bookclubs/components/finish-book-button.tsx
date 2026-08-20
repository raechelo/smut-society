'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { finishCurrentBook } from '@/lib/actions/clubs';

export function FinishBookButton({ clubId }: { clubId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleFinish = () => {
    startTransition(async () => {
      try {
        await finishCurrentBook(clubId);
        toast.success('Marked as finished');
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not finish the book'
        );
      }
    });
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
              color='warning'
              aria-label='Mark as finished'
            >
              <CheckCircle2 className='size-4' />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Admin: Mark book as finished for Bookclub
        </TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>
            This will mark the book as finished for the book club. Continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            No
          </Button>
          <Button
            color='warning'
            onClick={handleFinish}
            disabled={pending}
          >
            {pending ? <Loader2 className='size-4 animate-spin' /> : null} Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
