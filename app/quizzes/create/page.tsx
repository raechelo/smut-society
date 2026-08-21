import { PageLayout } from '@/components/app/page-layout';
import { QuizForm } from '../components/quiz-form';

export default function CreateQuizPage() {
  return (
    <PageLayout
      crumbs={[
        { label: 'Quizzes', link: '/quizzes' },
        { label: 'Create' },
      ]}
    >
      <div className='h-full overflow-y-auto pr-xs'>
        <QuizForm />
      </div>
    </PageLayout>
  );
}
