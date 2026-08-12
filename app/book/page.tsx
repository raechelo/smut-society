import { PageLayout } from '@/components/app/page-layout';
import { Details } from './components/details';
import { Hero } from './components/hero';
import { Extras } from './components/extra';

const BookPage = () => {
  return (
    <PageLayout>
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

// NEXT STEPS:
// allow user to create + save polls
// display poll results & allow users to vote
// allow user to vote on next book to read
// display currently selected book on page
// create individual game pages
// create calendar page with book club events
// show completed books on the past reads page
// allow users to view polls/book bingos for their past reads with a 'view challenges' button/page

// * lower importance
