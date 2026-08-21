import { PageLayout } from '@/components/app/page-layout';
import { getPublicClubs } from '@/lib/actions/clubs';
import { ExploreClubsBrowser } from '../components/explore-clubs-browser';

export default async function ExploreClubsPage() {
  const clubs = await getPublicClubs();

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: 'Explore' },
      ]}
    >
      <ExploreClubsBrowser clubs={clubs} />
    </PageLayout>
  );
}
