import { PageLayout } from '@/components/app/page-layout';
import { QuizForm } from '../components/quiz-form';

export default function CreateQuizPage() {
  return (
    <PageLayout
      crumbs={[
        { label: 'Challenges', link: '/challenges' },
        { label: 'Quizzes', link: '/challenges/quizzes' },
        { label: 'Create' },
      ]}
    >
      <div className='h-full overflow-y-auto pr-xs'>
        <QuizForm />
      </div>
    </PageLayout>
  );
}
