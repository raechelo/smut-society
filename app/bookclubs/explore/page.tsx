import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { getPublicClubs } from '@/lib/actions/clubs';
import { ClubCard } from '../components/club-card';
import { JoinButton } from '../components/join-button';

export default async function ExploreClubsPage() {
  const clubs = await getPublicClubs();

  return (
    <PageLayout title='Explore Clubs'>
      <div className='flex h-full flex-col gap-md'>
        <Link href='/bookclubs'>
          <Button variant='ghost' className='px-0'>
            <ArrowLeft /> Back to my bookclubs
          </Button>
        </Link>

        <div className='min-h-0 flex-1 overflow-y-auto pr-xs'>
          {clubs.length > 0 ? (
            <div className='grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3'>
              {clubs.map((club) => (
                <ClubCard
                  key={club.id}
                  name={club.name}
                  description={club.description}
                  memberCount={club.memberCount}
                  footer={
                    <>
                      <Link href={`/bookclubs/${club.id}`}>
                        <Button variant='outline'>
                          <Eye /> View
                        </Button>
                      </Link>
                      <JoinButton clubId={club.id} joined={club.isMember} />
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <p className='mt-xl text-center text-sm text-muted-foreground'>
              No public clubs yet. Be the first to create one!
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
