import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CircleUser } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/app/chip';
import { getClub } from '@/lib/actions/clubs';
import { JoinButton } from '../components/join-button';
import { LeaveButton } from '../components/leave-button';

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getClub(clubId);
  if (!club) notFound();

  return (
    <PageLayout title={club.name}>
      <div className='flex h-full flex-col gap-md overflow-y-auto pr-xs'>
        <Link href='/bookclubs'>
          <Button variant='ghost' className='px-0'>
            <ArrowLeft /> Back to my bookclubs
          </Button>
        </Link>

        <div className='flex flex-wrap items-center gap-xs'>
          <Chip
            label={club.isPublic ? 'Public' : 'Private'}
            size='small'
            variant='painted'
            colors={club.isPublic ? 'sapphire' : 'ink'}
          />
          <Chip
            label={`${club.memberCount} ${club.memberCount === 1 ? 'member' : 'members'}`}
            size='small'
            variant='outline'
            colors='secondary'
          />
          <div className='ml-auto'>
            {club.isMember ? (
              <LeaveButton clubId={club.id} />
            ) : club.isPublic ? (
              <JoinButton clubId={club.id} joined={false} />
            ) : null}
          </div>
        </div>

        {club.description && (
          <p className='max-w-2xl text-sm leading-relaxed text-foreground/90'>
            {club.description}
          </p>
        )}

        <div className='flex flex-col gap-sm'>
          <h2 className='font-heading text-lg font-semibold tracking-wide'>
            Members
          </h2>
          <div className='flex flex-wrap gap-lg'>
            {club.members.map((member) => (
              <div key={member.id} className='flex items-center gap-sm'>
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.image}
                    alt={member.name ?? 'Member'}
                    className='size-9 rounded-full object-cover'
                  />
                ) : (
                  <CircleUser className='size-9 text-muted-foreground' />
                )}
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>
                    {member.name ?? 'Anonymous'}
                  </span>
                  {member.role === 'admin' && (
                    <span className='text-xs text-muted-foreground'>Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
