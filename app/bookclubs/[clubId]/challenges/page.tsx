import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { getClub } from '@/lib/actions/clubs';
import { getClubSharedBingoCards } from '@/lib/actions/bingo';
import { SharedBingoCardView } from '../../components/shared-bingo-card';

export default async function ClubChallengesPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [club, cards] = await Promise.all([
    getClub(clubId),
    getClubSharedBingoCards(clubId),
  ]);
  if (!club) notFound();

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: club.name, link: `/bookclubs/${club.id}` },
        { label: 'Challenges' },
      ]}
    >
      <div className='flex h-full flex-col gap-md overflow-y-auto pr-xs'>
        <div className='flex flex-col gap-1'>
          <Typography
            variant='h2'
            display
            classNames='!mb-0 text-primary'
          >
            Shared challenges
          </Typography>
          <Typography
            variant='p2'
            color='muted'
          >
            Bingo cards members have shared with {club.name}.
          </Typography>
        </div>

        {cards.length === 0 ? (
          <Card
            shadow
            className='items-center justify-center py-xl'
          >
            <Typography
              variant='p2'
              color='muted'
            >
              No challenges shared yet.
            </Typography>
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
            {cards.map((card) => (
              <SharedBingoCardView
                key={card.cardId}
                card={card}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
