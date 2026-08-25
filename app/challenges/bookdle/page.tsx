import { PageLayout } from '@/components/app/page-layout';
import Typography from '@/components/ui/typography';
import { getTodayBookdle } from '@/lib/actions/bookdle';
import { BookdleBoard } from './bookdle-board';

// The daily word is generated (and cached) on the first request of the day, so
// this can't be statically prerendered.
export const dynamic = 'force-dynamic';

export default async function BookdlePage() {
  const state = await getTodayBookdle();

  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Bookdle' },
      ]}
    >
      <div className='flex h-full flex-col items-center gap-md overflow-y-auto pr-xs pt-md'>
        {state ? (
          <BookdleBoard
            key={state.gameId}
            initial={state}
          />
        ) : (
          <Typography
            variant='p2'
            color='muted'
            classNames='mt-xl'
          >
            Couldn&apos;t load today&apos;s puzzle. Please try again shortly.
          </Typography>
        )}
      </div>
    </PageLayout>
  );
}
