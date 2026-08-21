import { auth } from '@/auth';
import { PageLayout } from '@/components/app/page-layout';
import { Card } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import { Chip } from '@/components/app/chip';
import { getClubByInviteToken } from '@/lib/actions/clubs';
import { InviteActions } from '../../components/invite-actions';

export default async function JoinClubPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invite, session] = await Promise.all([
    getClubByInviteToken(token),
    auth(),
  ]);

  return (
    <PageLayout
      crumbs={[
        { label: 'Bookclubs', link: '/bookclubs' },
        { label: 'Invite' },
      ]}
    >
      <div className='flex h-full items-center justify-center'>
        <Card
          shadow
          cornerDecoration='diagonal'
          className='flex w-full max-w-[440px] flex-col gap-md'
        >
          {!invite ? (
            <>
              <Typography
                variant='h4'
                display
              >
                Invite not found
              </Typography>
              <Typography
                variant='p2'
                color='muted'
              >
                This invite link is invalid or the club is no longer available.
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant='caption'
                color='muted'
              >
                You&apos;re invited to join
              </Typography>
              <Typography
                variant='h3'
                display
                classNames='!mb-0 leading-tight'
              >
                {invite.name}
              </Typography>
              <div className='flex flex-wrap items-center gap-xs'>
                <Chip
                  label={invite.isPublic ? 'Public' : 'Private'}
                  size='small'
                  variant='painted'
                  colors={invite.isPublic ? 'sapphire' : 'ink'}
                />
                <Typography
                  variant='p2'
                  color='muted'
                  classNames='text-xs'
                >
                  {invite.memberCount}{' '}
                  {invite.memberCount === 1 ? 'member' : 'members'}
                </Typography>
              </div>
              {invite.description ? (
                <Typography
                  variant='p2'
                  color='muted'
                  classNames='leading-relaxed'
                >
                  {invite.description}
                </Typography>
              ) : null}
              {invite.isMember ? (
                <Typography
                  variant='p2'
                  color='muted'
                >
                  You&apos;re already a member of this club.
                </Typography>
              ) : null}
              <InviteActions
                token={token}
                clubId={invite.clubId}
                signedIn={!!session?.user?.id}
                isMember={invite.isMember}
              />
            </>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
