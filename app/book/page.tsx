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

// NEXT STEPS:
// set up database with Neon
// allow user to create + save polls
// display poll results & allow users to vote
// allow user to vote on next book to read
// display currently selected book on page
// change format of the book card
// tweak filters again (seem to be excluding too much)
// create individual game pages
// allow book clubs to be created/hosted*
// create calendar page with book club events
// add book club host to mark book as done*
// allow book club host to create events
// allow users to add events to their google calendar*
// show completed books on the past reads page
// allow users to view polls/book bingos for their past reads with a 'view challenges' button/page

// * lower importance
