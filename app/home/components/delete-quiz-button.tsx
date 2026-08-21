'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { deleteQuiz } from '@/lib/actions/quizzes';

export function DeleteQuizButton({
  quizId,
  title,
  redirectTo,
  trigger,
}: {
  quizId: string;
  title: string;
  // Where to go after deleting. Defaults to refreshing the current page (right
  // for a list); pass a path (e.g. the quiz detail page passes '/quizzes').
  redirectTo?: string;
  // Override the default icon-only trigger (e.g. a labeled button).
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteQuiz(quizId);
        toast.success('Quiz deleted');
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not delete the quiz'
        );
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button
            type='button'
            variant='ghost'
            color='error'
            size='icon-sm'
            aria-label={`Delete ${title}`}
            className='shrink-0'
          >
            <Trash2 className='size-4' />
          </Button>
        )
      }
      title='Delete quiz?'
      description={`This permanently deletes “${title}” along with its questions and outcomes. This cannot be undone.`}
      footer={
        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            color='error'
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Trash2 className='size-4' />
            )}
            Delete
          </Button>
        </div>
      }
    />
  );
}
