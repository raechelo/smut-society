import { PageLayout } from '@/components/app/page-layout';
import { Filter } from './components/filter';

// submit new book for book club

const Library = () => {
  return (
    <PageLayout title='Library'>
      <Filter />
    </PageLayout>
  );
};

export default Library;
