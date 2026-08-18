import { PageLayout } from '@/components/app/page-layout';
import { getReadingShelfBooks, getReadingGoals } from '@/lib/actions/home';
import { getGenreStats, getSpiceStats, getSourceStats } from '@/lib/actions/stats';
import Typography from '@/components/ui/typography';
import { ReadingGoals } from './components/reading-goals';
import { ReadingStats } from './components/reading-stats';
import { ReadingShelfTable } from './components/reading-shelf-table';

const PastReads = async () => {
  const [goals, books, genres, spice, source] = await Promise.all([
    getReadingGoals(),
    getReadingShelfBooks(),
    getGenreStats(),
    getSpiceStats(),
    getSourceStats(),
  ]);

  return (
    <PageLayout>
      <div className='flex size-full min-h-0 flex-col gap-lg overflow-y-auto pr-xs pb-md'>
        <ReadingGoals goals={goals} />

        <ReadingStats
          genres={genres}
          spice={spice}
          source={source}
        />

        <section className='flex flex-col gap-sm'>
          <Typography
            variant='h3'
            display
            classNames='!mb-0 text-primary'
          >
            Reading shelf
          </Typography>
          <ReadingShelfTable books={books} />
        </section>
      </div>
    </PageLayout>
  );
};

export default PastReads;
