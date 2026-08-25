import { PageLayout } from '@/components/app/page-layout';
import { PollForm } from '../components/poll-form';

export default function CreatePollPage() {
  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Polls', link: '/challenges/polls' },
        { label: 'Create' },
      ]}
    >
      <div className='h-full overflow-y-auto pr-xs'>
        <PollForm />
      </div>
    </PageLayout>
  );
}
