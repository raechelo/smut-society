import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { getClub } from '@/lib/actions/clubs';
import { CurrentlyReading } from '../components/currently-reading';
import { ClubProgress } from '../components/club-progress';
import { Discussion } from '../components/discussion';
import { Challenge } from '../components/challenge';
import { NextReadPanel } from '../components/next-read-panel';
import { NextEvent } from '../components/next-event';

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getClub(clubId);
  if (!club) notFound();

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: club.name },
      ]}
    >
      <div className='flex size-full flex-col gap-md overflow-y-auto pr-xs'>
        <NextEvent
          clubName={club.name}
          events={club.upcomingEvents}
          isMember={club.isMember}
        />
        <CurrentlyReading
          clubId={club.id}
          book={club.currentBook}
          isAdmin={club.isAdmin}
        />
        <ClubProgress
          clubId={club.id}
          book={club.currentBook}
          members={club.members}
          isMember={club.isMember}
        />

        <div className='grid grid-cols-1 gap-md lg:grid-cols-10'>
          <div className='lg:col-span-4'>
            <Discussion />
          </div>
          <div className='lg:col-span-3'>
            <Challenge />
          </div>
          <div className='lg:col-span-3'>
            <NextReadPanel
              clubId={club.id}
              nominations={club.nominations}
              isMember={club.isMember}
              isAdmin={club.isAdmin}
              hasCurrentBook={club.currentBook !== null}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
