import { PageLayout } from '@/components/app/page-layout';
import { LibraryCard } from '@/components/app/library-card';
import { CaseUpper, LayoutGrid, Vote } from 'lucide-react';
import Typography from '@/components/ui/typography';
import { Quizzes as QuizzesIcon } from '@/components/icons/quizzes';

const challenges = [
  {
    title: 'Bingo',
    subtitle: 'Make Your Predictions',
    cadence: 'Book' as const,
    description:
      'Build a bingo card of predictions for your next read and share it with the community.',
    Icon: LayoutGrid,
    color: 'rust' as const,
    href: '/challenges/bingo',
  },
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
    title: 'Quizzes',
    subtitle: 'Which One Are You?',
    cadence: 'Series' as const,
    description:
      'Take a community-made quiz to find out which character, trope, or troublemaker you are.',
    Icon: QuizzesIcon,
    color: 'sapphire' as const,
    href: '/challenges/quizzes',
  },
];

const Challenges = () => {
  return (
    <PageLayout>
      <div className='flex h-full flex-col gap-sm'>
        <Typography
          variant='h3'
          classNames='font-serif uppercase mb-2 text-md'
        >
          Explore all challenges
        </Typography>

        <div className='grid grid-cols-2 gap-md'>
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
    </PageLayout>
  );
};

export default Challenges;
