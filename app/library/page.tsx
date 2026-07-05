import { PageLayout } from '@/components/app/page-layout';
import { LibraryClient } from './components/library-client';

const Library = () => {
  return (
    <PageLayout title='Library'>
      <LibraryClient />
    </PageLayout>
  );
};

export default Library;
