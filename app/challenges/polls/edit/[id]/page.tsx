import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { getPollForEdit } from '@/lib/actions/polls';
import { PollForm } from '../../components/poll-form';

export default async function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Owner-gated: returns null for non-owners or a missing poll.
  const poll = await getPollForEdit(id);
  if (!poll) notFound();

  // Shape the DB rows into the form's initial state (its fields are strings).
  const initial = {
    title: poll.title,
    description: poll.description ?? '',
    tags: poll.tags,
    options: poll.options.map((o) => ({ id: o.id, text: o.text })),
  };

  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Polls', link: '/challenges/polls' },
        { label: poll.title },
        { label: 'Edit' },
      ]}
    >
      <div className='h-full overflow-y-auto pr-xs'>
        <PollForm
          pollId={poll.id}
          initial={initial}
        />
      </div>
    </PageLayout>
  );
}
