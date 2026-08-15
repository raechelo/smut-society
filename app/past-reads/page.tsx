import { PageLayout } from '@/components/app/page-layout';
import { getCompletedBooks, getReadingGoals } from '@/lib/actions/home';
import Typography from '@/components/ui/typography';
import { ReadingGoals } from './components/reading-goals';
import { CompletedBooksTable } from './components/completed-books-table';

const PastReads = async () => {
  const [goals, books] = await Promise.all([
    getReadingGoals(),
    getCompletedBooks(),
  ]);

  return (
    <PageLayout>
      <div className='flex size-full min-h-0 flex-col gap-lg overflow-y-auto pr-xs pb-md'>
        <ReadingGoals goals={goals} />

        <section className='flex flex-col gap-sm'>
          <Typography
            variant='h3'
            display
            classNames='!mb-0 text-primary'
          >
            Completed books
          </Typography>
          <CompletedBooksTable books={books} />
        </section>
      </div>
    </PageLayout>
  );
};

export default PastReads;
