'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { getUserClubs } from '@/lib/actions/books';
import { shareBingoCardToClubs } from '@/lib/actions/bingo';

type Club = { id: string; name: string };

// A club picker styled after SubmitToPoolDialog, for sharing a bingo card with
// the user's clubs. Persists a share per selected club so it shows up under the
// club's Challenges.
export function ShareToClubDialog({
  cardId,
  cardTitle,
  open,
  onOpenChange,
}: {
  cardId: string;
  cardTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Load the user's clubs the first time the dialog opens.
  useEffect(() => {
    if (!open || clubs !== null) return;
    let cancelled = false;
    getUserClubs()
      .then((result) => {
        if (!cancelled) setClubs(result);
      })
      .catch(() => {
        if (!cancelled) setClubs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clubs]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await shareBingoCardToClubs(cardId, [...selected]);
      toast.success(
        selected.size === 1
          ? 'Shared with your club'
          : `Shared with ${selected.size} clubs`
      );
      onOpenChange(false);
      setSelected(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not share the card'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className='flex flex-col gap-4'>
      {clubs === null ? (
        <div className='flex items-center justify-center py-6 text-muted-foreground'>
          <Loader2 className='size-5 animate-spin' />
        </div>
      ) : clubs.length === 0 ? (
        <Typography
          variant='p2'
          color='muted'
          classNames='py-4 text-center'
        >
          You haven’t joined any book clubs yet.
        </Typography>
      ) : (
        <ul className='flex flex-col gap-1'>
          {clubs.map((club) => {
            const checked = selected.has(club.id);
            return (
              <li key={club.id}>
                <Button
                  type='button'
                  variant={checked ? 'solid' : 'outline'}
                  onClick={() => toggle(club.id)}
                  aria-pressed={checked}
                  className='w-full justify-start font-normal normal-case tracking-normal'
                >
                  <Check
                    className={cn('size-4 shrink-0', !checked && 'opacity-0')}
                  />
                  <Typography
                    variant='span'
                    classNames='min-w-0 truncate'
                  >
                    {club.name}
                  </Typography>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {clubs && clubs.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
        >
          {submitting && <Loader2 className='size-4 animate-spin' />}
          {selected.size > 1
            ? `Share with ${selected.size} clubs`
            : 'Share with club'}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={<span className='hidden' />}
      title='Share with a book club'
      description={
        cardTitle
          ? `Share “${cardTitle}” with your clubs.`
          : 'Share your bingo card with your clubs.'
      }
      content={content}
    />
  );
}
