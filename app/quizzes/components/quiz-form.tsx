'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/app/tag-input';
import Typography from '@/components/ui/typography';
import { createQuiz } from '@/lib/actions/quizzes';

const MAX_ANSWERS = 10;

// `outcomeId` links an answer to the outcome it counts toward (null until the
// author picks one).
type Answer = { id: string; text: string; outcomeId: string | null };
type Question = { id: string; text: string; answers: Answer[] };
type Outcome = { id: string; title: string; description: string };

const newAnswer = (): Answer => ({
  id: crypto.randomUUID(),
  text: '',
  outcomeId: null,
});
const newQuestion = (): Question => ({
  id: crypto.randomUUID(),
  text: '',
  answers: [newAnswer()],
});
const newOutcome = (): Outcome => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
});

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant='caption'
      color='muted'
      classNames='text-xs font-medium'
    >
      {children}
    </Typography>
  );
}

export function QuizForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>(() => [newQuestion()]);
  const [outcomes, setOutcomes] = useState<Outcome[]>(() => [newOutcome()]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  // --- questions ---
  const addQuestion = () => setQuestions((qs) => [...qs, newQuestion()]);
  const removeQuestion = (qId: string) =>
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== qId) : qs));
  const setQuestionText = (qId: string, text: string) =>
    setQuestions((qs) => qs.map((q) => (q.id === qId ? { ...q, text } : q)));

  // --- answers ---
  const addAnswer = (qId: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId && q.answers.length < MAX_ANSWERS
          ? { ...q, answers: [...q.answers, newAnswer()] }
          : q
      )
    );
  const removeAnswer = (qId: string, aId: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId && q.answers.length > 1
          ? { ...q, answers: q.answers.filter((a) => a.id !== aId) }
          : q
      )
    );
  const setAnswerText = (qId: string, aId: string, text: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === aId ? { ...a, text } : a
              ),
            }
          : q
      )
    );
  const setAnswerOutcome = (qId: string, aId: string, outcomeId: string) =>
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === aId ? { ...a, outcomeId } : a
              ),
            }
          : q
      )
    );

  // --- outcomes ---
  const addOutcome = () => setOutcomes((os) => [...os, newOutcome()]);
  const removeOutcome = (oId: string) => {
    setOutcomes((os) => (os.length > 1 ? os.filter((o) => o.id !== oId) : os));
    // Unlink any answers that pointed at the removed outcome.
    setQuestions((qs) =>
      qs.map((q) => ({
        ...q,
        answers: q.answers.map((a) =>
          a.outcomeId === oId ? { ...a, outcomeId: null } : a
        ),
      }))
    );
  };
  const setOutcomeField = (
    oId: string,
    field: 'title' | 'description',
    value: string
  ) =>
    setOutcomes((os) =>
      os.map((o) => (o.id === oId ? { ...o, [field]: value } : o))
    );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Trim everything and drop empty questions/answers before persisting.
    const cleanedQuestions = questions
      .map((q) => ({
        text: q.text.trim(),
        answers: q.answers
          .filter((a) => a.text.trim())
          .map((a) => ({ text: a.text.trim(), outcomeId: a.outcomeId })),
      }))
      .filter((q) => q.text && q.answers.length > 0);

    if (cleanedQuestions.length === 0) {
      toast.error('Add at least one question with an answer');
      return;
    }

    // Keep the client id so the server can resolve answer → outcome links.
    const cleanedOutcomes = outcomes
      .map((o) => ({
        id: o.id,
        title: o.title.trim(),
        description: o.description.trim(),
      }))
      .filter((o) => o.title);

    if (cleanedOutcomes.length === 0) {
      toast.error('Add at least one outcome');
      return;
    }

    setSubmitting(true);
    try {
      await createQuiz({
        title: title.trim(),
        description: description.trim() || null,
        tags,
        questions: cleanedQuestions,
        outcomes: cleanedOutcomes,
      });
      toast.success('Quiz created');
      router.push('/quizzes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create the quiz';
      toast.error(msg === 'Unauthorized' ? 'Sign in to create a quiz' : msg);
      setSubmitting(false);
    }
  };

  return (
    <form
      className='mx-auto flex w-full max-w-[768px] flex-col gap-6'
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className='flex flex-col gap-1'>
        <Typography
          variant='h3'
          display
          classNames='!mb-0'
        >
          Create a quiz
        </Typography>
        <Typography
          variant='p2'
          color='muted'
        >
          Build a quiz for the community to play.
        </Typography>
      </div>

      {/* Details */}
      <Card
        shadow
        className='gap-4'
      >
        <label className='flex flex-col gap-1.5'>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. Which fantasy heroine are you?'
            autoFocus
          />
        </label>

        <label className='flex flex-col gap-1.5'>
          <FieldLabel>
            Description <span className='font-normal'>(optional)</span>
          </FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder='What is this quiz about?'
          />
        </label>

        <div className='flex flex-col gap-1.5'>
          <FieldLabel>
            Tags <span className='font-normal'>(optional)</span>
          </FieldLabel>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder='e.g. romance, fantasy, personality'
          />
        </div>
      </Card>

      {/* Outcomes — defined first so answers below can map to them. */}
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography
            variant='h4'
            display
            classNames='!mb-0 text-primary'
          >
            Outcomes
          </Typography>
          <Typography
            variant='p2'
            color='muted'
            classNames='text-xs'
          >
            Define the possible results first — each answer below maps to one.
          </Typography>
        </div>
        {outcomes.map((o, oi) => (
          <Card
            key={o.id}
            shadow
            className='gap-4'
          >
            <div className='flex items-center justify-between gap-2'>
              <Typography
                variant='h6'
                classNames='font-semibold tracking-wide'
              >
                Outcome {oi + 1}
              </Typography>
              {outcomes.length > 1 && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Remove outcome'
                  onClick={() => removeOutcome(o.id)}
                >
                  <Trash2 className='size-4' />
                </Button>
              )}
            </div>

            <label className='flex flex-col gap-1.5'>
              <FieldLabel>Title</FieldLabel>
              <Input
                value={o.title}
                onChange={(e) => setOutcomeField(o.id, 'title', e.target.value)}
                placeholder='e.g. The Cinnamon Roll'
              />
            </label>

            <label className='flex flex-col gap-1.5'>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={o.description}
                onChange={(e) =>
                  setOutcomeField(o.id, 'description', e.target.value)
                }
                rows={3}
                placeholder='Describe this result…'
              />
            </label>
          </Card>
        ))}

        <Button
          type='button'
          variant='outline'
          color='accent'
          className='self-start'
          onClick={addOutcome}
        >
          <Plus className='size-4' /> Add outcome
        </Button>
      </div>

      {/* Questions */}
      <div className='flex flex-col gap-4'>
        <Typography
          variant='h4'
          display
          classNames='!mb-0 text-primary'
        >
          Questions
        </Typography>
        {questions.map((q, qi) => (
          <Card
            key={q.id}
            shadow
            className='gap-4'
          >
            <div className='flex items-center justify-between gap-2'>
              <Typography
                variant='h6'
                classNames='font-semibold tracking-wide'
              >
                Question {qi + 1}
              </Typography>
              {questions.length > 1 && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Remove question'
                  onClick={() => removeQuestion(q.id)}
                >
                  <Trash2 className='size-4' />
                </Button>
              )}
            </div>

            <label className='flex flex-col gap-1.5'>
              <FieldLabel>Question</FieldLabel>
              <Input
                value={q.text}
                onChange={(e) => setQuestionText(q.id, e.target.value)}
                placeholder='Ask something…'
              />
            </label>

            <div className='flex flex-col gap-2'>
              <FieldLabel>Answers</FieldLabel>
              {q.answers.map((a, ai) => (
                <div
                  key={a.id}
                  className='flex items-center gap-2'
                >
                  <Input
                    value={a.text}
                    onChange={(e) => setAnswerText(q.id, a.id, e.target.value)}
                    placeholder={`Answer ${ai + 1}`}
                    className='min-w-0 flex-1'
                  />
                  <Select
                    value={a.outcomeId ?? undefined}
                    onValueChange={(v) => setAnswerOutcome(q.id, a.id, v)}
                  >
                    <SelectTrigger className='w-[170px] shrink-0'>
                      <SelectValue placeholder='Maps to…' />
                    </SelectTrigger>
                    <SelectContent>
                      {outcomes.map((o, oi) => (
                        <SelectItem
                          key={o.id}
                          value={o.id}
                        >
                          {o.title.trim() || `Outcome ${oi + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {q.answers.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Remove answer'
                      onClick={() => removeAnswer(q.id, a.id)}
                    >
                      <X className='size-4' />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='self-start'
                disabled={q.answers.length >= MAX_ANSWERS}
                onClick={() => addAnswer(q.id)}
              >
                <Plus className='size-4' /> Add answer
              </Button>
              {q.answers.length >= MAX_ANSWERS && (
                <Typography
                  variant='p2'
                  color='muted'
                  classNames='text-xs'
                >
                  Up to {MAX_ANSWERS} answers per question.
                </Typography>
              )}
            </div>
          </Card>
        ))}

        <Button
          type='button'
          variant='outline'
          color='accent'
          className='self-start'
          onClick={addQuestion}
        >
          <Plus className='size-4' /> Add question
        </Button>
      </div>

      <div className='flex justify-end pb-md'>
        <Button
          type='submit'
          disabled={!canSubmit}
        >
          Create quiz
        </Button>
      </div>
    </form>
  );
}
