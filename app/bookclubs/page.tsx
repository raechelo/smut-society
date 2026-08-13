import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Chip } from '@/components/app/chip';
import { getMyClubs } from '@/lib/actions/clubs';
import { MyClubCard } from './components/my-club-card';
import { CreateClubDialog } from './components/create-club-dialog';

export default async function BookclubsPage() {
  const clubs = await getMyClubs();

  return (
    <PageLayout>
      <div className='flex h-full flex-col gap-md'>
        <div className='flex flex-wrap items-center justify-between gap-sm'>
          <Typography
            variant='p2'
            color='muted'
          >
            Your book clubs
          </Typography>
          <div className='flex items-center gap-xs'>
            <Link href='/bookclubs/explore'>
              <Button variant='outline'>
                <Compass /> Explore
              </Button>
            </Link>
            <CreateClubDialog />
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto pr-xs pt-1'>
          {clubs.length > 0 ? (
            <div className='flex flex-col gap-md'>
              {clubs.map((club) => (
                <MyClubCard
                  key={club.id}
                  id={club.id}
                  name={club.name}
                  description={club.description}
                  memberCount={club.memberCount}
                  upcomingEventCount={club.upcomingEventCount}
                  badges={
                    <>
                      <Chip
                        label={club.isPublic ? 'Public' : 'Private'}
                        size='small'
                        variant='painted'
                        colors={club.isPublic ? 'sapphire' : 'ink'}
                      />
                      {club.role === 'admin' && (
                        <Chip
                          label='Admin'
                          size='small'
                          variant='outline'
                          colors='accent'
                        />
                      )}
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <div className='mt-xl flex flex-col items-center gap-sm text-center'>
              <Typography
                variant='p2'
                color='muted'
              >
                You have not joined any book clubs yet.
              </Typography>
              <div className='flex gap-xs'>
                <Link href='/bookclubs/explore'>
                  <Button variant='outline'>
                    <Compass /> Explore clubs
                  </Button>
                </Link>
                <CreateClubDialog />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
