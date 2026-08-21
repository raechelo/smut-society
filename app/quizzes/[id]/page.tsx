import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import { getQuizDetail } from '@/lib/actions/quizzes';
import { QuizRunner } from '../components/quiz-runner';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizDetail(id);
  if (!quiz) notFound();

  return (
    <PageLayout
      crumbs={[
        { label: 'Quizzes', link: '/quizzes' },
        { label: quiz.title },
      ]}
    >
      <div className='flex h-full flex-col gap-md overflow-y-auto pr-xs'>
        <div className='flex flex-col gap-2'>
          <Typography
            variant='h2'
            classNames='!mb-0 font-serif text-primary'
          >
            {quiz.title}
          </Typography>
          {quiz.description ? (
            <Typography
              variant='p2'
              color='muted'
              classNames='leading-relaxed'
            >
              {quiz.description}
            </Typography>
          ) : null}
          {quiz.tags.length > 0 && (
            <div className='flex flex-wrap gap-xs'>
              {quiz.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size='small'
                  variant='painted'
                  colors='accent'
                  className='capitalize'
                />
              ))}
            </div>
          )}
        </div>

        <QuizRunner
          quizId={quiz.id}
          questions={quiz.questions}
        />
      </div>
    </PageLayout>
  );
}
