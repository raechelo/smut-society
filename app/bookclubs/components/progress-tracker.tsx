'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  updateProgress,
  type ProgressUnit,
  type ReadingProgress,
} from '@/lib/actions/clubs';

const UNIT_LABEL: Record<ProgressUnit, string> = {
  chapter: 'Chapter',
  page: 'Page',
};

function summarize(p: ReadingProgress | null): string {
  if (!p) return 'Not started';
  if (p.finished) return '✓ Finished';
  if (p.value > 0) return `On ${UNIT_LABEL[p.unit].toLowerCase()} ${p.value}`;
  return 'Not started';
}

export function ProgressTracker({
  clubId,
  bookId,
  initial,
}: {
  clubId: string;
  bookId: string;
  initial: ReadingProgress | null;
}) {
  const [saved, setSaved] = useState<ReadingProgress | null>(initial);
  const [unit, setUnit] = useState<ProgressUnit>(initial?.unit ?? 'chapter');
  const [value, setValue] = useState<string>(
    initial?.value ? String(initial.value) : ''
  );
  const [finished, setFinished] = useState(initial?.finished ?? false);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    const numeric = Math.max(0, Math.trunc(Number(value)) || 0);
    const next: ReadingProgress = { unit, value: numeric, finished };
    startTransition(async () => {
      try {
        await updateProgress(clubId, bookId, next);
        setSaved(next);
        toast.success('Progress updated');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Could not save progress'
        );
      }
    });
  };

  return (
    <div className='flex flex-col gap-2'>
      <Card
        cornerDecoration='top'
        className='gap-3 border-transparent bg-sidebar bg-none text-sidebar-foreground shadow-md dark:bg-none'
      >
        <span className='text-sm font-medium text-sidebar-foreground/85'>
          {summarize(saved)}
        </span>

        <div className='grid grid-cols-2 gap-1 rounded-md border border-sidebar-foreground/25 p-0.5'>
          {(['chapter', 'page'] as ProgressUnit[]).map((u) => (
            <button
              key={u}
              type='button'
              onClick={() => setUnit(u)}
              className={cn(
                'rounded-[5px] px-2 py-1 text-sm transition-colors',
                unit === u
                  ? 'bg-parchment text-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
              )}
            >
              {UNIT_LABEL[u]}
            </button>
          ))}
        </div>

        <label className='flex items-center gap-2 text-sm'>
          <span className='text-sidebar-foreground/85'>{UNIT_LABEL[unit]}</span>
          <Input
            type='number'
            min={0}
            value={value}
            disabled={finished}
            onChange={(e) => setValue(e.target.value)}
            placeholder='0'
            className='h-8 border-parchment/40 bg-parchment text-foreground'
          />
        </label>

        <button
          type='button'
          onClick={() => setFinished((f) => !f)}
          aria-pressed={finished}
          className={cn(
            'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors',
            finished
              ? 'border-parchment bg-parchment/20 text-sidebar-foreground'
              : 'border-sidebar-foreground/30 hover:border-parchment/60'
          )}
        >
          <span
            className={cn(
              'flex size-4 items-center justify-center rounded-[4px] border',
              finished
                ? 'border-parchment bg-parchment text-primary'
                : 'border-sidebar-foreground/40'
            )}
          >
            {finished && <Check className='size-3' />}
          </span>
          Finished the book
        </button>

        <Button
          size='sm'
          variant='secondary'
          onClick={handleSave}
          disabled={pending}
          className='w-full'
        >
          {pending && <Loader2 className='size-4 animate-spin' />}
          Update progress
        </Button>
      </Card>
    </div>
  );
}
