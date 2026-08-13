import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import Typography from '@/components/ui/typography';

// Presentational club card. Wrap in a <Link> (My Bookclubs) to make the whole
// card navigate, or pass `footer` actions (Explore) instead.
export function ClubCard({
  name,
  description,
  memberCount,
  badges,
  footer,
}: {
  name: string;
  description: string | null;
  memberCount: number;
  badges?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card
      shadow
      cornerDecoration='diagonal'
      className='flex h-full flex-col gap-sm transition-transform hover:-translate-y-0.5'
    >
      <Typography
        variant='h6'
        classNames='font-semibold tracking-wide'
      >
        {name}
      </Typography>
      {badges ? <div className='flex flex-wrap gap-xs'>{badges}</div> : null}
      {description ? (
        <Typography
          variant='p2'
          color='muted'
          classNames='line-clamp-3 leading-relaxed'
        >
          {description}
        </Typography>
      ) : (
        <Typography
          variant='p2'
          classNames='italic text-muted-foreground/70'
        >
          No description yet.
        </Typography>
      )}
      <Typography
        variant='p2'
        color='muted'
        classNames='mt-auto text-xs'
      >
        {memberCount} {memberCount === 1 ? 'member' : 'members'}
      </Typography>
      {footer ? <div className='flex gap-xs pt-xs'>{footer}</div> : null}
    </Card>
  );
}
