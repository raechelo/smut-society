import { notFound } from 'next/navigation';
import { CircleUser, Sparkles } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Chip } from '@/components/app/chip';
import { getClub } from '@/lib/actions/clubs';
import { JoinButton } from '../components/join-button';
import { ClubManage } from '../components/club-manage';
import { PromoteMemberButton } from '../components/promote-member-button';
import { BookThumb } from '../components/next-read-section';
import { NextReadPanel } from '../components/next-read-panel';
import { FinishBookButton } from '../components/finish-book-button';
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
    <PageLayout title={club.name}>
      <div className='flex h-full flex-col gap-md mt-md overflow-y-auto pr-xs'>
        <Breadcrumbs
          breadcrumbs={[
            { label: 'Bookclubs', link: '/bookclubs' },
            { label: club.name },
          ]}
        />

        <div className='grid gap-lg lg:grid-cols-[minmax(0,1fr)_300px]'>
          <div className='flex min-w-0 flex-col gap-md'>
            <div className='flex flex-wrap items-center gap-xs'>
              <Chip
                label={club.isPublic ? 'Public' : 'Private'}
                size='small'
                variant='painted'
                colors={club.isPublic ? 'sapphire' : 'ink'}
              />
              <Chip
                label={`${club.memberCount} ${
                  club.memberCount === 1 ? 'member' : 'members'
                }`}
                size='small'
                variant='outline'
                colors='secondary'
              />
              {club.archivedAt && (
                <Chip
                  label='Archived'
                  size='small'
                  variant='outline'
                  colors='secondary'
                />
              )}
              {!club.isMember && club.isPublic && (
                <div className='ml-auto'>
                  <JoinButton
                    clubId={club.id}
                    joined={false}
                  />
                </div>
              )}
            </div>

            {club.description && (
              <p className='max-w-2xl text-sm leading-relaxed text-foreground/90'>
                {club.description}
              </p>
            )}

            {/* Current read */}
            <div className='flex flex-col gap-sm'>
              <h2 className='font-heading text-lg font-semibold tracking-wide'>
                Currently reading
              </h2>
              {club.currentBook ? (
                <div className='flex items-center gap-md rounded-md border border-border/50 bg-card/40 p-md'>
                  <BookThumb
                    cover={club.currentBook.cover}
                    title={club.currentBook.title}
                  />
                  <div className='flex min-w-0 flex-col gap-sm'>
                    <div>
                      <p className='font-heading text-lg font-semibold'>
                        {club.currentBook.title}
                      </p>
                      {club.currentBook.author && (
                        <p className='text-sm text-muted-foreground'>
                          {club.currentBook.author}
                        </p>
                      )}
                    </div>
                  </div>
                  {club.isAdmin && (
                    <div className='ml-auto self-start'>
                      <FinishBookButton clubId={club.id} />
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-start gap-sm rounded-md border border-dashed border-primary/40 bg-primary/5 p-md text-sm'>
                  <Sparkles className='mt-0.5 size-5 shrink-0 text-primary' />
                  <div>
                    <p className='font-medium text-foreground'>
                      No book picked yet.
                    </p>
                    <p className='text-muted-foreground'>
                      {club.isAdmin
                        ? 'Pick the club’s next read from the nominations in the sidebar.'
                        : 'The club needs to pick its next read from the nominations in the sidebar.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reading history */}
            {club.finishedBooks.length > 0 && (
              <div className='flex flex-col gap-sm'>
                <h2 className='font-heading text-lg font-semibold tracking-wide'>
                  Previously read
                </h2>
                <div className='flex flex-wrap gap-md'>
                  {club.finishedBooks.map((book) => (
                    <div
                      key={`${book.bookId}-${book.finishedAt.getTime()}`}
                      className='flex w-28 flex-col gap-xs'
                    >
                      <BookThumb
                        cover={book.cover}
                        title={book.title}
                      />
                      <p className='line-clamp-2 text-xs font-medium'>
                        {book.title}
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        {book.finishedAt.toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className='flex flex-col gap-sm'>
              <h2 className='font-heading text-lg font-semibold tracking-wide'>
                Members
              </h2>
              <div className='flex flex-wrap gap-lg'>
                {club.members.map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center gap-sm'
                  >
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
                      {member.role === 'admin' ? (
                        <span className='text-xs text-muted-foreground'>
                          Admin
                        </span>
                      ) : (
                        club.isAdmin && (
                          <PromoteMemberButton
                            clubId={club.id}
                            memberUserId={member.id}
                            memberName={member.name ?? 'This member'}
                          />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {club.isMember && (
              <ClubManage
                clubId={club.id}
                clubName={club.name}
                isAdmin={club.isAdmin}
                isOwner={club.isOwner}
                archived={club.archivedAt !== null}
              />
            )}
          </div>

          <aside className='flex flex-col gap-lg lg:sticky lg:top-0 lg:h-fit'>
            {club.isMember && club.currentBook && (
              <ProgressTracker
                clubId={club.id}
                bookId={club.currentBook.bookId}
                initial={club.myProgress}
              />
            )}
            <NextEventPanel
              clubId={club.id}
              events={club.upcomingEvents}
              totalCount={club.upcomingEventCount}
              isMember={club.isMember}
              isAdmin={club.isAdmin}
            />
            <NextReadPanel
              clubId={club.id}
              nominations={club.nominations}
              isMember={club.isMember}
              isAdmin={club.isAdmin}
              hasCurrentBook={club.currentBook !== null}
            />
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
