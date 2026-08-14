'use client';

import { useState, useTransition } from 'react';
import { BookOpen, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { toggleNominationVote } from '@/lib/actions/books';
import { setCurrentBook } from '@/lib/actions/clubs';
import type { ClubNomination } from '@/lib/actions/clubs';

type NominationState = ClubNomination;

// Keep the list ordered by votes (then title) so the front-runner stays on top
// as members vote, mirroring the server's ordering.
function resort(items: NominationState[]): NominationState[] {
  return [...items].sort(
    (a, b) => b.voteCount - a.voteCount || a.title.localeCompare(b.title)
  );
}

export function NextReadSection({
  clubId,
  nominations,
  isMember,
  isAdmin,
  hasCurrentBook,
  // Tighter layout for the narrow sidebar: the admin "Pick" button drops to its
  // own full-width row beneath the title instead of sitting inline.
  compact = false,
}: {
  clubId: string;
  nominations: ClubNomination[];
  isMember: boolean;
  isAdmin: boolean;
  hasCurrentBook: boolean;
  compact?: boolean;
}) {
  const [items, setItems] = useState<NominationState[]>(nominations);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleVote = (id: string) => {
    if (!isMember) {
      toast.error('Join this club to vote');
      return;
    }
    // Optimistically flip the vote and re-sort by tally.
    setItems((prev) =>
      resort(
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                hasVoted: !n.hasVoted,
                voteCount: n.voteCount + (n.hasVoted ? -1 : 1),
              }
            : n
        )
      )
    );
    startTransition(async () => {
      try {
        await toggleNominationVote(id);
      } catch {
        // Roll back on failure.
        setItems((prev) =>
          resort(
            prev.map((n) =>
              n.id === id
                ? {
                    ...n,
                    hasVoted: !n.hasVoted,
                    voteCount: n.voteCount + (n.hasVoted ? -1 : 1),
                  }
                : n
            )
          )
        );
        toast.error('Could not save your vote');
      }
    });
  };

  const handleSelect = (id: string) => {
    setSelectingId(id);
    startTransition(async () => {
      try {
        await setCurrentBook(clubId, id);
        // Drop it from the pool locally; revalidatePath refreshes the
        // "Currently reading" section on the server.
        setItems((prev) => prev.filter((n) => n.id !== id));
        setSelectingId(null);
        toast.success('Set as the current read');
      } catch (err) {
        setSelectingId(null);
        toast.error(
          err instanceof Error ? err.message : 'Could not pick the book'
        );
      }
    });
  };

  if (items.length === 0) {
    return (
      <Typography
        variant='p2'
        classNames='italic text-muted-foreground/70'
      >
        No books nominated yet. Add books to the pool from the library to start
        the vote.
      </Typography>
    );
  }

  return (
    <ul className='flex flex-col gap-sm'>
      {items.map((n) => {
        const pick = isAdmin ? (
          <Button
            size='sm'
            variant='outline'
            disabled={selectingId !== null}
            onClick={() => handleSelect(n.id)}
            className={compact ? 'w-full' : undefined}
          >
            {selectingId === n.id ? (
              <Loader2 className='size-4 animate-spin' />
            ) : hasCurrentBook ? (
              'Pick next'
            ) : (
              'Pick this'
            )}
          </Button>
        ) : null;

        return (
          <li
            key={n.id}
            className={cn(
              'rounded-md border border-border/50 bg-card/40 p-sm',
              compact ? 'flex flex-col gap-sm' : 'flex items-center gap-sm'
            )}
          >
            <div className='flex min-w-0 flex-1 items-center gap-sm'>
              <VoteButton
                count={n.voteCount}
                active={n.hasVoted}
                onClick={() => handleVote(n.id)}
              />
              <BookThumb cover={n.cover} title={n.title} size='sm' />
              <div className='min-w-0 flex-1'>
                <Typography
                  variant='p2'
                  classNames='truncate font-medium'
                >
                  {n.title}
                </Typography>
                {n.author && (
                  <Typography
                    variant='p2'
                    color='muted'
                    classNames='truncate text-xs'
                  >
                    {n.author}
                  </Typography>
                )}
              </div>
              {!compact && pick}
            </div>
            {compact && pick}
          </li>
        );
      })}
    </ul>
  );
}

function VoteButton({
  count,
  active,
  onClick,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size='sm'
      variant={active ? 'solid' : 'outline'}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Remove vote' : 'Vote'}
      className='shrink-0'
    >
      <ChevronUp className='size-4' />
      {count}
    </Button>
  );
}

export function BookThumb({
  cover,
  title,
  size = 'lg',
}: {
  cover: string | null;
  title: string;
  size?: 'sm' | 'lg';
}) {
  const dims = size === 'lg' ? 'h-28 w-20' : 'h-16 w-11';
  if (!cover) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground',
          dims
        )}
      >
        <BookOpen className='size-5' />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cover}
      alt={title}
      className={cn('shrink-0 rounded-sm object-cover shadow-sm', dims)}
    />
  );
}
