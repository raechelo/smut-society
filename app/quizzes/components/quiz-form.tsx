'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
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
import { createQuiz, updateQuiz } from '@/lib/actions/quizzes';
import { uploadQuizAsset } from '@/lib/actions/quiz-assets';

const MAX_ANSWERS = 10;

// `outcomeId` links an answer to the outcome it counts toward (null until the
// author picks one).
type Answer = { id: string; text: string; outcomeId: string | null };
type Question = { id: string; text: string; answers: Answer[] };
type Outcome = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

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
  imageUrl: null,
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

export function QuizForm({
  quizId,
  initial,
}: {
  // When provided, the form edits an existing quiz instead of creating one.
  quizId?: string;
  initial?: {
    title: string;
    description: string;
    tags: string[];
    outcomes: Outcome[];
    questions: Question[];
  };
}) {
  const router = useRouter();
  const isEdit = !!quizId;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [questions, setQuestions] = useState<Question[]>(() =>
    initial?.questions?.length ? initial.questions : [newQuestion()]
  );
  const [outcomes, setOutcomes] = useState<Outcome[]>(() =>
    initial?.outcomes?.length ? initial.outcomes : [newOutcome()]
  );
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
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
  const setOutcomeImage = (oId: string, imageUrl: string | null) =>
    setOutcomes((os) =>
      os.map((o) => (o.id === oId ? { ...o, imageUrl } : o))
    );

  // Upload the picked image to the assets repo, then store its URL on the
  // outcome. Runs as soon as a file is chosen so the author sees a preview.
  const handleOutcomeImage = async (oId: string, file: File | null) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [oId]: true }));
    try {
      const data = new FormData();
      data.append('file', file);
      const { url } = await uploadQuizAsset(data);
      setOutcomeImage(oId, url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not upload the image'
      );
    } finally {
      setUploading((u) => ({ ...u, [oId]: false }));
    }
  };

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
        imageUrl: o.imageUrl,
      }))
      .filter((o) => o.title);

    if (cleanedOutcomes.length === 0) {
      toast.error('Add at least one outcome');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      tags,
      questions: cleanedQuestions,
      outcomes: cleanedOutcomes,
    };

    setSubmitting(true);
    try {
      if (isEdit && quizId) {
        await updateQuiz(quizId, payload);
        toast.success('Quiz updated');
        router.push(`/quizzes/${quizId}`);
      } else {
        await createQuiz(payload);
        toast.success('Quiz created');
        router.push('/quizzes');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save the quiz';
      toast.error(msg === 'Unauthorized' ? 'Sign in to save a quiz' : msg);
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
          {isEdit ? 'Edit quiz' : 'Create a quiz'}
        </Typography>
        <Typography
          variant='p2'
          color='muted'
        >
          {isEdit
            ? 'Update your quiz — changes go live right away.'
            : 'Build a quiz for the community to play.'}
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

            <div className='flex flex-col gap-1.5'>
              <FieldLabel>
                Image <span className='font-normal'>(optional)</span>
              </FieldLabel>
              {o.imageUrl ? (
                <div className='relative w-fit'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={o.imageUrl}
                    alt=''
                    className='h-28 w-28 rounded-md object-cover shadow-sm'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Remove image'
                    onClick={() => setOutcomeImage(o.id, null)}
                    className='absolute right-1 top-1 bg-card/85 backdrop-blur'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  variant='outline'
                  size='sm'
                  className='w-fit cursor-pointer'
                >
                  <label>
                    {uploading[o.id] ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <ImagePlus className='size-4' />
                    )}
                    {uploading[o.id] ? 'Uploading…' : 'Add image'}
                    <input
                      type='file'
                      accept='image/png,image/jpeg,image/gif,image/webp'
                      className='hidden'
                      disabled={!!uploading[o.id]}
                      onChange={(e) => {
                        handleOutcomeImage(o.id, e.target.files?.[0] ?? null);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </Button>
              )}
            </div>
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
          {isEdit ? 'Save changes' : 'Create quiz'}
        </Button>
      </div>
    </form>
  );
}
