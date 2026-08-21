import { PageLayout } from '@/components/app/page-layout';
import { librariansPick, trendingBooks } from '@/lib/hardcover';
import { LibrariansPick } from './components/librarians-pick';
import { LibraryClient } from './components/library-client';

const Library = async () => {
  const [pick, trending] = await Promise.all([
    librariansPick(),
    trendingBooks(),
  ]);
  const trendingRest = pick
    ? trending.filter((b) => b.slug !== pick.slug)
    : trending;

  return (
    <PageLayout>
      <div className='flex size-full min-h-0 flex-col gap-md overflow-y-auto pr-xs pb-md'>
        <LibrariansPick />
        <LibraryClient trending={trendingRest} />
      </div>
    </PageLayout>
  );
};

export default Library;
