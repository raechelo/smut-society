import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageLayout } from '@/components/app/page-layout';
import { Button } from '@/components/ui/button';
import { getQuizzes } from '@/lib/actions/quizzes';
import { QuizBrowser } from './components/quiz-browser';

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  return (
    <PageLayout
      crumbs={[{ label: 'Quizzes' }]}
      cta={
        <Link href='/quizzes/create'>
          <Button>
            <Plus /> Create quiz
          </Button>
        </Link>
      }
    >
      <QuizBrowser quizzes={quizzes} />
    </PageLayout>
  );
}
