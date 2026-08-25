import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { getClubSharedBingoCards } from '@/lib/actions/bingo';

// Shared bingo cards from club members. Uses the sidebar (deep red) fill.
export async function Challenge({ clubId }: { clubId: string }) {
  const cards = await getClubSharedBingoCards(clubId, 4);
  const href = `/bookclubs/${clubId}/challenges`;

  return (
    <div className='panel-shadow flex h-full min-h-40 w-full flex-col gap-2 rounded-md bg-sidebar p-md text-sidebar-foreground'>
      <div className='flex items-center justify-between gap-2'>
        <Typography
          variant='h4'
          display
          classNames='!mb-0 text-accent-light'
        >
          Challenges
        </Typography>
        <Button
          asChild
          size='icon-sm'
          variant='outline'
          color='accent'
          aria-label='View all shared challenges'
        >
          <Link href={href}>
            <ArrowRight className='size-4' />
          </Link>
        </Button>
      </div>

      {cards.length === 0 ? (
        <Typography
          variant='p2'
          classNames='text-sidebar-foreground/70'
        >
          No bingo cards shared yet. Share one from the Bingo challenge.
        </Typography>
      ) : (
        <ul className='flex flex-col divide-y divide-white/10'>
          {cards.map((card) => (
            <li
              key={card.cardId}
              className='flex flex-col gap-0.5 py-2'
            >
              <Typography
                variant='p2'
                classNames='truncate font-medium'
              >
                {card.title.trim() || 'Untitled card'}
              </Typography>
              <Typography
                variant='span'
                classNames='text-sidebar-foreground/70'
              >
                {card.ownerName ?? 'Someone'} · {card.markedCount}/25 marked
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
