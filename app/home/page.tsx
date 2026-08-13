import { auth } from '@/auth';
import { PageLayout } from '@/components/app/page-layout';
import Typography from '@/components/ui/typography';
import { Notifications } from './components/notifications';
import { ReadingGoal } from './components/reading-goal';
import { MyReading } from './components/my-reading';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <PageLayout>
        <Typography
          variant='p2'
          color='muted'
          classNames='mt-md'
        >
          Sign in to see your home.
        </Typography>
      </PageLayout>
    );
  }

  const firstName = session.user.name?.split(' ')[0];

  return (
    <PageLayout>
      <div className='flex size-full min-h-0 flex-col overflow-y-auto pr-xs pb-md'>
        <Typography
          variant='h2'
          display
          classNames='!mb-0 mt-md text-primary'
        >
          {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        </Typography>

        <div className='mt-md grid gap-md lg:grid-cols-3'>
          <div className='flex flex-col gap-md lg:col-span-2'>
            <MyReading />
            <Notifications />
          </div>
          <div className='flex flex-col gap-md'>
            <ReadingGoal />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
