import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { auth } from '@/auth';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/app/chip';
import Typography from '@/components/ui/typography';
import { getQuizDetail, getMyQuizRating } from '@/lib/actions/quizzes';
import { QuizRunner } from '../components/quiz-runner';
import { DeleteQuizButton } from '@/app/home/components/delete-quiz-button';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quiz, session, myRating] = await Promise.all([
    getQuizDetail(id),
    auth(),
    getMyQuizRating(id),
  ]);
  if (!quiz) notFound();

  const isOwner = !!session?.user?.id && session.user.id === quiz.createdBy;

  return (
    <PageLayout
      crumbs={[
        { label: 'Quizzes', link: '/quizzes' },
        { label: quiz.title },
      ]}
      cta={
        isOwner ? (
          <div className='flex items-center gap-xs'>
            <DeleteQuizButton
              quizId={quiz.id}
              title={quiz.title}
              redirectTo='/quizzes'
              trigger={
                <Button color='error'>
                  <Trash2 /> Delete
                </Button>
              }
            />
            <Link href={`/quizzes/edit/${quiz.id}`}>
              <Button>
                <Pencil /> Edit
              </Button>
            </Link>
          </div>
        ) : undefined
      }
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
          signedIn={!!session?.user?.id}
          initialRating={myRating}
        />
      </div>
    </PageLayout>
  );
}
