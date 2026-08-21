import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { Quizzes as QuizzesIcon } from '@/components/icons/quizzes';
import { getMyQuizzes } from '@/lib/actions/quizzes';
import { DeleteQuizButton } from './delete-quiz-button';

export async function YourQuizzes() {
  const quizzes = await getMyQuizzes();

  return (
    <Card
      shadow
      className='w-full gap-3'
    >
      <div className='flex items-center justify-between gap-2'>
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
        <Link href='/quizzes/create'>
          <Button
            variant='outline'
            size='sm'
          >
            <Plus /> New
          </Button>
        </Link>
      </div>

      {quizzes.length > 0 ? (
        <ul className='flex flex-col divide-y divide-border/50'>
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className='flex items-center gap-2 py-2'
            >
              <Link
                href={`/quizzes/${quiz.id}`}
                className='group/quiz min-w-0 flex-1'
              >
                <Typography
                  variant='p2'
                  classNames='truncate font-medium transition-colors group-hover/quiz:text-primary'
                >
                  {quiz.title}
                </Typography>
                <Typography
                  variant='span'
                  color='muted'
                  classNames='text-xs'
                >
                  {quiz.questionCount}{' '}
                  {quiz.questionCount === 1 ? 'question' : 'questions'} ·{' '}
                  {quiz.outcomeCount}{' '}
                  {quiz.outcomeCount === 1 ? 'outcome' : 'outcomes'}
                </Typography>
              </Link>
              <DeleteQuizButton
                quizId={quiz.id}
                title={quiz.title}
              />
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
