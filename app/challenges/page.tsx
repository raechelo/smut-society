import { PageLayout } from '@/components/app/page-layout';
import { Hero } from './components/hero';
import { LibraryCard } from '@/components/app/library-card';
import { CaseUpper, Feather, Vote } from 'lucide-react';
import Typography from '@/components/ui/typography';
import { Pepper } from '@/components/icons/pepper';

const challenges = [
  {
    title: 'Bookdle',
    subtitle: 'Daily Word Puzzle',
    cadence: 'Daily' as const,
    description:
      "Guess today's character, location, or magical artifact in 6 tries.",
    Icon: CaseUpper,
    color: 'sienna' as const,
    href: '/challenges/bookdle',
  },
  {
    title: 'Quote',
    subtitle: 'Look into the Past',
    cadence: 'Book' as const,
    description:
      'What was your favorite quote from the book? Share it with the community!',
    Icon: Feather,
    color: 'sapphire' as const,
    href: '/challenges/quote',
  },
  {
    title: 'Polls',
    subtitle: 'Past and Present',
    cadence: 'Book' as const,
    description:
      'How unbearable were the characters in this book? How unbearable did you think they were going to be? Vote here!',
    Icon: Vote,
    color: 'secondary' as const,
    href: '/challenges/polls',
  },
  {
    title: 'Spice',
    subtitle: 'Too Hot to Handle',
    cadence: 'Book' as const,
    description:
      'How spicy was this read? And how spicy did you want it to be? Give us your thoughts and see what others think!',
    Icon: Pepper,
    color: 'accent' as const,
    href: '/challenges/spice-factor',
  },
];

const Challenges = () => {
  return (
    <PageLayout title='Challenges'>
      <div className='flex flex-col h-full'>
        <div className='flex h-[40%] flex-col gap-sm'>
          <div className='min-h-0 flex-1'>
            <Hero />
          </div>
        </div>
        <div className='flex min-h-0 flex-1 flex-col gap-sm pt-md'>
          <Typography
            variant='h3'
            classNames='font-serif uppercase mb-2 text-md'
          >
            Explore all challenges
          </Typography>

          <div className='grid flex-1 grid-cols-2 grid-rows-2 gap-md'>
            {challenges.map((challenge, i) => (
              <LibraryCard
                key={i}
                variant='default'
                cadence={challenge.cadence}
                title={challenge.title}
                subtitle={challenge.subtitle}
                description={challenge.description}
                Icon={challenge.Icon}
                color={challenge.color}
              />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Challenges;
