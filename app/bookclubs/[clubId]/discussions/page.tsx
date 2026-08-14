import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { getClub } from '@/lib/actions/clubs';
import { getThreadsWithComments } from '@/lib/actions/discussions';
import { NewThreadForm } from '../../components/new-thread-form';
import { ThreadCard } from '../../components/thread-card';

export default async function DiscussionsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getClub(clubId);
  if (!club) notFound();

  const threads = await getThreadsWithComments(clubId);

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: club.name, link: `/bookclubs/${clubId}` },
        { label: 'Discussion' },
      ]}
    >
      <div className='flex size-full min-h-0 flex-col overflow-y-auto pr-xs pb-md'>
        <div className='mx-auto flex w-full max-w-[48rem] flex-col gap-md'>
          {club.isMember ? (
            <NewThreadForm clubId={clubId} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              Join this club to start a thread.
            </p>
          )}

          {threads.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No threads yet — be the first to post.
            </p>
          ) : (
            threads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                canPost={club.isMember}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
