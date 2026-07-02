import { PageLayout } from '@/components/app/page-layout';
import { Details } from './components/details';
import { Purchase } from './components/purchase';

const BookPage = () => {
  return (
    <PageLayout title='Current Book'>
      <div className='size-full flex flex-row gap-md'>
        <div className='w-[60%]'>img will go here</div>
        <div className='w-[40%] h-full flex flex-col gap-sm p-md'>
          <Details />
          <Purchase />
        </div>
      </div>
    </PageLayout>
  );
};

export default BookPage;
