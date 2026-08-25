import Link from 'next/link';
import { Plus } from 'lucide-react';
import { auth } from '@/auth';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { getPolls } from '@/lib/actions/polls';
import { PollBrowser } from './components/poll-browser';

export default async function PollsPage() {
  const [polls, session] = await Promise.all([getPolls(), auth()]);

  return (
    <PageLayout
      crumbs={[{ label: 'Challenges', link: '/challenges' }, { label: 'Polls' }]}
      cta={
        <Link href='/challenges/polls/create'>
          <Button>
            <Plus /> Create poll
          </Button>
        </Link>
      }
    >
      <PollBrowser
        polls={polls}
        currentUserId={session?.user?.id ?? null}
      />
    </PageLayout>
  );
}
