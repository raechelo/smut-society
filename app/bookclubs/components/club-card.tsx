import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

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
      <h3 className='font-heading text-lg font-semibold tracking-wide'>{name}</h3>
      {badges ? <div className='flex flex-wrap gap-xs'>{badges}</div> : null}
      {description ? (
        <p className='line-clamp-3 text-sm leading-relaxed text-muted-foreground'>
          {description}
        </p>
      ) : (
        <p className='text-sm italic text-muted-foreground/70'>
          No description yet.
        </p>
      )}
      <p className='mt-auto text-xs text-muted-foreground'>
        {memberCount} {memberCount === 1 ? 'member' : 'members'}
      </p>
      {footer ? <div className='flex gap-xs pt-xs'>{footer}</div> : null}
    </Card>
  );
}
