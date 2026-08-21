'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import {
  scoreQuiz,
  type QuizDetail,
  type QuizResult,
} from '@/lib/actions/quizzes';

export function QuizRunner({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuizDetail['questions'];
}) {
  // Maps a question id to the chosen answer id.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered =
    questions.length > 0 && questions.every((q) => selected[q.id]);

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error('Answer every question first');
      return;
    }
    setSubmitting(true);
    try {
      const answerIds = questions.map((q) => selected[q.id]).filter(Boolean);
      const outcome = await scoreQuiz(quizId, answerIds);
      if (outcome) setResult(outcome);
      else toast.error('Could not score the quiz');
    } catch {
      toast.error('Could not score the quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setSelected({});
  };

  if (result) {
    return (
      <div className='flex flex-col items-center gap-md'>
        <Card
          shadow
          cornerDecoration='diagonal'
          className='w-[80%] items-center gap-3 py-xl text-center'
        >
          <Typography
            variant='caption'
            color='muted'
          >
            Your result
          </Typography>
          <Typography
            variant='h3'
            classNames='!mb-0 font-serif text-primary'
          >
            {result.title}
          </Typography>
          {result.description && (
            <Typography
              variant='p2'
              color='muted'
              classNames='max-w-[60ch] leading-relaxed'
            >
              {result.description}
            </Typography>
          )}
        </Card>
        <Button
          variant='outline'
          onClick={retake}
        >
          Retake quiz
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-[40px] items-center'>
      {questions.map((q, qi) => (
        <div
          key={q.id}
          className='w-[80%]'
        >
          <Typography
            variant='h6'
            classNames='text-[20px] font-semibold tracking-wide mb-sm'
          >
            {qi + 1}. {q.text}
          </Typography>
          <div
            role='radiogroup'
            aria-label={q.text}
            className='flex flex-col gap-2 ml-xl'
          >
            {q.answers.map((a) => (
              <label
                key={a.id}
                className='flex cursor-pointer items-center gap-2'
              >
                <input
                  type='radio'
                  name={q.id}
                  value={a.id}
                  checked={selected[q.id] === a.id}
                  onChange={() => setSelected((s) => ({ ...s, [q.id]: a.id }))}
                  className='size-4 shrink-0 accent-primary'
                />
                <Typography variant='p2'>{a.text}</Typography>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className='flex w-[80%] justify-end'>
        <Button
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0}
        >
          {submitting ? 'Scoring…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
