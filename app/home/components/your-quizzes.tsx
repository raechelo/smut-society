import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Rating } from '@/components/ui/rating';
import Typography from '@/components/ui/typography';
import { Quizzes as QuizzesIcon } from '@/components/icons/quizzes';
import { getMyQuizzes } from '@/lib/actions/quizzes';

export async function YourQuizzes() {
  const quizzes = await getMyQuizzes();

  return (
    <Card
      shadow
      className='w-full gap-3'
    >
      <div className='flex items-center gap-2'>
        <QuizzesIcon className='size-5 text-primary' />
        <Typography
          variant='h4'
          display
          classNames='!mb-0 text-primary'
        >
          Your quizzes
        </Typography>
      </div>

      {quizzes.length > 0 ? (
        <ul className='flex flex-col divide-y divide-border/50'>
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/quizzes/${quiz.id}`}
                className='group/quiz flex flex-col gap-1 py-2'
              >
                <Typography
                  variant='p2'
                  classNames='truncate font-medium transition-colors group-hover/quiz:text-primary'
                >
                  {quiz.title}
                </Typography>
                {quiz.ratingCount > 0 ? (
                  <div className='flex items-center gap-2'>
                    <Rating
                      rate={quiz.avgRating ?? 0}
                      showScore
                    />
                    <Typography
                      variant='span'
                      color='muted'
                    >
                      ({quiz.ratingCount})
                    </Typography>
                  </div>
                ) : (
                  <Typography
                    variant='span'
                    color='muted'
                    classNames='text-xs'
                  >
                    No ratings yet
                  </Typography>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Typography
          variant='p2'
          color='muted'
          classNames='text-sm'
        >
          You haven&apos;t created any quizzes yet.
        </Typography>
      )}
    </Card>
  );
}
