import { Card } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import type { ClubNomination } from '@/lib/actions/clubs';
import { NextReadSection } from './next-read-section';

type NextReadPanelProps = {
  clubId: string;
  nominations: ClubNomination[];
  isMember: boolean;
  isAdmin: boolean;
  hasCurrentBook: boolean;
};

export function NextReadPanel({
  clubId,
  nominations,
  isMember,
  isAdmin,
  hasCurrentBook,
}: NextReadPanelProps) {
  return (
    <div className='flex h-full flex-col gap-2'>
      <Card
        shadow
        className='h-full gap-sm border-accent/40'
      >
        <Typography
          variant='h4'
          display
          classNames='!mb-0 text-primary'
        >
          Next reads
        </Typography>
        <NextReadSection
          compact
          clubId={clubId}
          nominations={nominations}
          isMember={isMember}
          isAdmin={isAdmin}
          hasCurrentBook={hasCurrentBook}
        />
      </Card>
    </div>
  );
}
