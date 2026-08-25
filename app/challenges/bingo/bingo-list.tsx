'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/app/dialog';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  createBingoCard,
  deleteBingoCard,
  type BingoCardListItem,
} from '@/lib/actions/bingo';

// A 5×5 glance preview: daubed squares in accent, filled-but-unmarked squares
// tinted, empty squares faint.
function MiniGrid({ cells }: { cells: BingoCardListItem['cells'] }) {
  return (
    <div className='grid aspect-square w-full grid-cols-5 grid-rows-5 gap-0.5'>
      {cells.map((c, i) => (
        <span
          key={i}
          className={cn(
            'rounded-[2px]',
            c.marked
              ? 'bg-accent'
              : c.text.trim()
                ? 'bg-foreground/25'
                : 'bg-foreground/5'
          )}
        />
      ))}
    </div>
  );
}

function DeleteCardButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      try {
        await deleteBingoCard(id);
        toast.success('Card deleted');
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not delete the card'
        );
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type='button'
          variant='ghost'
          color='error'
          size='icon-sm'
          aria-label={`Delete ${title}`}
          className='shrink-0 bg-card/80 backdrop-blur'
        >
          <Trash2 className='size-4' />
        </Button>
      }
      title='Delete bingo card?'
      description={`This permanently deletes “${title}”. This cannot be undone.`}
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

export function BingoList({
  cards,
  signedIn,
}: {
  cards: BingoCardListItem[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { id } = await createBingoCard();
      router.push(`/challenges/bingo/${id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not create a card'
      );
      setCreating(false);
    }
  };

  if (!signedIn) {
    return (
      <Card
        shadow
        className='mx-auto mt-xl max-w-md items-center gap-3 text-center'
      >
        <Typography
          variant='p2'
          color='muted'
        >
          Sign in to create and save your bingo cards.
        </Typography>
        <Button onClick={() => signIn('google')}>Sign in</Button>
      </Card>
    );
  }

  return (
    <div className='flex flex-col gap-md'>
      <div className='flex items-center justify-between gap-3'>
        <Typography
          variant='p2'
          color='muted'
        >
          {cards.length === 0
            ? 'You haven’t made any bingo cards yet.'
            : `${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
        </Typography>
        <Button
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <Plus className='size-4' />
          )}
          New card
        </Button>
      </div>

      {cards.length > 0 && (
        <div className='grid grid-cols-2 gap-md sm:grid-cols-3'>
          {cards.map((card) => {
            const displayTitle = card.title.trim() || 'Untitled card';
            return (
              // The whole card links to the editor; the delete control is an
              // absolutely-positioned sibling (not nested in the link).
              <div
                key={card.id}
                className='relative transition-transform hover:-translate-y-0.5'
              >
                <Link href={`/challenges/bingo/${card.id}`}>
                  <Card
                    shadow
                    className='size-full gap-sm'
                  >
                    <Typography
                      variant='h6'
                      classNames='truncate pr-8 font-semibold tracking-wide'
                    >
                      {displayTitle}
                    </Typography>
                    <MiniGrid cells={card.cells} />
                    <Typography
                      variant='span'
                      color='muted'
                      classNames='text-xs'
                    >
                      {card.locked
                        ? `In play · ${card.markedCount}/25 marked`
                        : `Draft · ${card.filledCount}/25 filled`}
                    </Typography>
                  </Card>
                </Link>
                <div className='absolute right-2 top-2 z-10'>
                  <DeleteCardButton
                    id={card.id}
                    title={displayTitle}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
