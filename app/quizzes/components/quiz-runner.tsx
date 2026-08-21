'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  rateQuiz,
  scoreQuiz,
  type QuizDetail,
  type QuizResult,
} from '@/lib/actions/quizzes';

// A 1–5 interactive star input.
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className='flex items-center gap-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className='cursor-pointer p-0.5'
        >
          <Star
            className={cn(
              'size-7 transition-colors',
              n <= active
                ? 'fill-accent stroke-accent'
                : 'fill-transparent stroke-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function QuizRunner({
  quizId,
  questions,
  signedIn,
  initialRating,
}: {
  quizId: string;
  questions: QuizDetail['questions'];
  signedIn: boolean;
  initialRating: number | null;
}) {
  // Maps a question id to the chosen answer id.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(initialRating ?? 0);

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

  const handleRate = async (value: number) => {
    const previous = rating;
    setRating(value); // optimistic
    try {
      await rateQuiz(quizId, value);
      toast.success('Rating saved');
    } catch (err) {
      setRating(previous);
      toast.error(
        err instanceof Error ? err.message : 'Could not save your rating'
      );
    }
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
          {result.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.imageUrl}
              alt={result.title}
              className='size-40 rounded-md object-cover shadow-sm'
            />
          )}
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

        <div className='flex flex-col items-center gap-1.5'>
          <Typography
            variant='caption'
            color='muted'
          >
            Rate this quiz
          </Typography>
          {signedIn ? (
            <StarRating
              value={rating}
              onChange={handleRate}
            />
          ) : (
            <Typography
              variant='p2'
              color='muted'
            >
              Sign in to rate this quiz.
            </Typography>
          )}
        </div>

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
