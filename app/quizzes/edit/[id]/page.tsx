import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/app/page-layout';
import { getQuizForEdit } from '@/lib/actions/quizzes';
import { QuizForm } from '../../components/quiz-form';

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Owner-gated: returns null for non-owners or a missing quiz.
  const quiz = await getQuizForEdit(id);
  if (!quiz) notFound();

  // Shape the DB rows into the form's initial state (its fields are strings).
  const initial = {
    title: quiz.title,
    description: quiz.description ?? '',
    tags: quiz.tags,
    outcomes: quiz.outcomes.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description ?? '',
      imageUrl: o.imageUrl,
    })),
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        outcomeId: a.outcomeId,
      })),
    })),
  };

  return (
    <PageLayout
      crumbs={[
        { label: 'Quizzes', link: '/quizzes' },
        { label: quiz.title, link: `/quizzes/${quiz.id}` },
        { label: 'Edit' },
      ]}
    >
      <div className='h-full overflow-y-auto pr-xs'>
        <QuizForm
          quizId={quiz.id}
          initial={initial}
        />
      </div>
    </PageLayout>
  );
}
