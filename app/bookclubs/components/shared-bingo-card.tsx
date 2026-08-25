import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type { SharedBingoCard } from '@/lib/actions/bingo';

const CENTER = 12; // 5×5 free space

// A read-only rendering of a shared bingo card: the 5×5 grid with predictions
// and a big translucent X over daubed squares.
export function SharedBingoCardView({ card }: { card: SharedBingoCard }) {
  return (
    <Card
      shadow
      className='gap-sm'
    >
      <div className='flex flex-col gap-0.5'>
        <Typography
          variant='h6'
          classNames='truncate font-semibold tracking-wide'
        >
          {card.title.trim() || 'Untitled card'}
        </Typography>
        <Typography
          variant='span'
          color='muted'
          classNames='text-xs'
        >
          {card.ownerName ?? 'Someone'} · {card.markedCount}/25 marked
        </Typography>
      </div>

      <div className='grid aspect-square w-full grid-cols-5 grid-rows-5 gap-1 rounded-md border border-accent-light bg-card p-1'>
        {card.cells.map((cell, i) => {
          const text = cell.text.trim() || (i === CENTER ? 'FREE' : '');
          return (
            <div
              key={i}
              className={cn(
                'relative flex items-center justify-center overflow-hidden rounded-[3px] border p-0.5 text-center',
                cell.marked
                  ? 'border-accent bg-accent/15'
                  : 'border-border bg-parchment/40'
              )}
            >
              <span
                className={cn(
                  'line-clamp-4 break-words text-[9px] leading-tight',
                  i === CENTER && !cell.text.trim() && 'opacity-40'
                )}
              >
                {text}
              </span>
              {cell.marked && (
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 flex items-center justify-center p-0.5'
                >
                  <X className='size-full text-accent opacity-50' />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
