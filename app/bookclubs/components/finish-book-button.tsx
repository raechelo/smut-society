'use client';

import { useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { finishCurrentBook } from '@/lib/actions/clubs';

export function FinishBookButton({ clubId }: { clubId: string }) {
  const [pending, startTransition] = useTransition();

  const handleFinish = () => {
    startTransition(async () => {
      try {
        await finishCurrentBook(clubId);
        toast.success('Marked as finished');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not finish the book'
        );
      }
    });
  };

  return (
    <Button
      size='sm'
      variant='outline'
      disabled={pending}
      onClick={handleFinish}
    >
      {pending ? (
        <Loader2 className='size-4 animate-spin' />
      ) : (
        <CheckCircle2 className='size-4' />
      )}
      Mark as finished
    </Button>
  );
}
