'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { TagInput } from '@/components/app/tag-input';
import Typography from '@/components/ui/typography';
import { createPoll, updatePoll } from '@/lib/actions/polls';

const MAX_OPTIONS = 20;

type Option = { id: string; text: string };

const newOption = (): Option => ({ id: crypto.randomUUID(), text: '' });

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

export function PollForm({
  pollId,
  initial,
}: {
  // When provided, the form edits an existing poll instead of creating one.
  pollId?: string;
  initial?: {
    title: string;
    description: string;
    tags: string[];
    options: Option[];
  };
}) {
  const router = useRouter();
  const isEdit = !!pollId;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  // A poll starts with two blank options — it needs at least a choice.
  const [options, setOptions] = useState<Option[]>(() =>
    initial?.options?.length ? initial.options : [newOption(), newOption()]
  );
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && !submitting;

  const addOption = () =>
    setOptions((os) => (os.length < MAX_OPTIONS ? [...os, newOption()] : os));
  // Keep a minimum of two options.
  const removeOption = (oId: string) =>
    setOptions((os) => (os.length > 2 ? os.filter((o) => o.id !== oId) : os));
  const setOptionText = (oId: string, text: string) =>
    setOptions((os) => os.map((o) => (o.id === oId ? { ...o, text } : o)));

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const cleanedOptions = options
      .filter((o) => o.text.trim())
      .map((o) => ({ text: o.text.trim() }));

    if (cleanedOptions.length < 2) {
      toast.error('Add at least two answer options');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      tags,
      options: cleanedOptions,
    };

    setSubmitting(true);
    try {
      if (isEdit && pollId) {
        await updatePoll(pollId, payload);
        toast.success('Poll updated');
      } else {
        await createPoll(payload);
        toast.success('Poll created');
      }
      router.push('/challenges/polls');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save the poll';
      toast.error(msg === 'Unauthorized' ? 'Sign in to save a poll' : msg);
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
          {isEdit ? 'Edit poll' : 'Create a poll'}
        </Typography>
        <Typography
          variant='p2'
          color='muted'
        >
          {isEdit
            ? 'Update your poll — changes go live right away.'
            : 'Ask the community one question — there are no wrong answers.'}
        </Typography>
      </div>

      {/* Details — the title is the question being asked. */}
      <Card
        shadow
        className='gap-4'
      >
        <label className='flex flex-col gap-1.5'>
          <FieldLabel>Question</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g. Who was the most unbearable character?'
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
            placeholder='Add any context for your question…'
          />
        </label>

        <div className='flex flex-col gap-1.5'>
          <FieldLabel>
            Tags <span className='font-normal'>(optional)</span>
          </FieldLabel>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder='e.g. romance, hot-takes, characters'
          />
        </div>
      </Card>

      {/* Answer options */}
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography
            variant='h4'
            display
            classNames='!mb-0 text-primary'
          >
            Answers
          </Typography>
          <Typography
            variant='p2'
            color='muted'
            classNames='text-xs'
          >
            Add as many answers as you like — voters pick one.
          </Typography>
        </div>

        <Card
          shadow
          className='gap-2'
        >
          {options.map((o, oi) => (
            <div
              key={o.id}
              className='flex items-center gap-2'
            >
              <Input
                value={o.text}
                onChange={(e) => setOptionText(o.id, e.target.value)}
                placeholder={`Answer ${oi + 1}`}
                className='min-w-0 flex-1'
              />
              {options.length > 2 && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Remove answer'
                  onClick={() => removeOption(o.id)}
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
            disabled={options.length >= MAX_OPTIONS}
            onClick={addOption}
          >
            <Plus className='size-4' /> Add answer
          </Button>
          {options.length >= MAX_OPTIONS && (
            <Typography
              variant='p2'
              color='muted'
              classNames='text-xs'
            >
              Up to {MAX_OPTIONS} answers per poll.
            </Typography>
          )}
        </Card>
      </div>

      <div className='flex justify-end pb-md'>
        <Button
          type='submit'
          disabled={!canSubmit}
        >
          {isEdit ? 'Save changes' : 'Create poll'}
        </Button>
      </div>
    </form>
  );
}
