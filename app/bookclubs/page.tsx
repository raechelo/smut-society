import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Chip } from '@/components/app/chip';
import { getMyClubs, getPublicClubs } from '@/lib/actions/clubs';
import { MyClubCard } from './components/my-club-card';
import { CreateClubDialog } from './components/create-club-dialog';
import { ExploreClubsBrowser } from './components/explore-clubs-browser';

export default async function BookclubsPage() {
  const [clubs, publicClubs] = await Promise.all([
    getMyClubs(),
    getPublicClubs(),
  ]);

  return (
    <PageLayout
      crumbs={[{ label: 'Bookclubs' }]}
      cta={
        <div className='flex items-center gap-xs'>
          <Link href='/bookclubs/explore'>
            <Button variant='outline'>
              <Compass /> Explore
            </Button>
          </Link>
          <CreateClubDialog />
        </div>
      }
    >
      {/* The page scrolls as a whole; each section flows at natural height. */}
      <div className='flex h-full flex-col gap-xl overflow-y-auto pr-xs'>
        <section className='flex flex-col gap-md'>
          <Typography
            variant='h4'
            display
          >
            Your clubs
          </Typography>
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
            <Typography
              variant='p2'
              color='muted'
            >
              You have not joined any book clubs yet. Browse the clubs below, or
              start your own.
            </Typography>
          )}
        </section>

        <section className='flex flex-col gap-md'>
          <Typography
            variant='h4'
            display
          >
            Explore
          </Typography>
          <ExploreClubsBrowser
            clubs={publicClubs}
            fillHeight={false}
          />
        </section>
      </div>
    </PageLayout>
  );
}
