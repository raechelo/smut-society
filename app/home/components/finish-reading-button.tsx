'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { finishClubRead, finishShelfBook } from '@/lib/actions/home';

export function FinishReadingButton({
  clubId,
  bookId,
}: {
  clubId: string | null;
  bookId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    // The cover sits inside a link for club reads — don't navigate.
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    try {
      if (clubId) await finishClubRead(clubId, bookId);
      else await finishShelfBook(bookId);
      toast.success('Marked as finished');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not mark as finished'
      );
      setPending(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size='icon-xs'
            onClick={onClick}
            disabled={pending}
            aria-label='Finish book'
            className='absolute right-1 top-1 rounded-full opacity-0 shadow transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-100'
          >
            {pending ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Check className='size-3.5' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Finish book</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
