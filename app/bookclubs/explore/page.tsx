import Link from 'next/link';
import { Eye } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { getPublicClubs } from '@/lib/actions/clubs';
import { ClubCard } from '../components/club-card';
import { JoinButton } from '../components/join-button';

export default async function ExploreClubsPage() {
  const clubs = await getPublicClubs();

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: 'Explore' },
      ]}
    >
      <div className='flex h-full flex-col gap-md'>
        <div className='min-h-0 flex-1 overflow-y-auto pr-xs pt-1'>
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
                      <JoinButton
                        clubId={club.id}
                        joined={club.isMember}
                      />
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <Typography
              variant='p2'
              color='muted'
              classNames='mt-xl text-center'
            >
              No public clubs yet. Be the first to create one!
            </Typography>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
