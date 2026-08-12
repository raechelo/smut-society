import { Card } from '@/components/ui/card';
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
    <div className='flex flex-col gap-2'>
      <Card
        shadow
        className='gap-sm border-accent/40'
      >
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
