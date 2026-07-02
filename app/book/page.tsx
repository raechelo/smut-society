import { PageLayout } from '@/components/app/page-layout';
import { Details } from './components/details';
import { Hero } from './components/hero';
import { Extras } from './components/extra';

const BookPage = () => {
  return (
    <PageLayout title='Current Book'>
      <div className='size-full flex flex-col gap-md'>
        <div className='flex gap-md h-[64%]'>
          <Hero />
          <Details />
        </div>
        <div className='flex flex-row gap-md h-[35%] w-full'>
          <Extras />
        </div>
      </div>
    </PageLayout>
  );
};

export default BookPage;
