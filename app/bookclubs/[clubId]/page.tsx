import { notFound } from 'next/navigation';
import { CircleUser } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Chip } from '@/components/app/chip';
import { getClub } from '@/lib/actions/clubs';
import { JoinButton } from '../components/join-button';
import { ClubManage } from '../components/club-manage';
import { PromoteMemberButton } from '../components/promote-member-button';
import { BookThumb } from '../components/next-read-section';
import { CurrentlyReading } from '../components/currently-reading';
import { NextReadPanel } from '../components/next-read-panel';
import { NextEventPanel } from '../components/next-event-card';
import { ProgressTracker } from '../components/progress-tracker';
import { Breadcrumbs } from '@/components/app/breadcrumb';

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
      <div className='flex h-full flex-col gap-md overflow-y-auto pr-xs'></div>
    </PageLayout>
  );
}
