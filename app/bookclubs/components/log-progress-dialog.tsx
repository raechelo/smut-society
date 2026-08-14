'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
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
const LABEL = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export function LogProgressDialog({
  clubId,
  bookId,
  initial,
}: {
  clubId: string;
  bookId: string;
  initial: ReadingProgress | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<ProgressUnit>(initial?.unit ?? 'chapter');
  const [value, setValue] = useState(
    initial?.value ? String(initial.value) : ''
  );
  const [finished, setFinished] = useState(initial?.finished ?? false);
  const [saving, setSaving] = useState(false);

  // Reseed the form from the saved state each time the dialog opens.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setUnit(initial?.unit ?? 'chapter');
      setValue(initial?.value ? String(initial.value) : '');
      setFinished(initial?.finished ?? false);
    }
    setOpen(next);
  };

  const handleSave = async () => {
    setSaving(true);
    const numeric = Math.max(0, Math.trunc(Number(value)) || 0);
    try {
      await updateProgress(clubId, bookId, { unit, value: numeric, finished });
      toast.success('Progress updated');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save progress'
      );
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1.5'>
        <span className={LABEL}>Tracking by</span>
        <div className='grid grid-cols-2 gap-1 rounded-md border border-border/60 p-0.5'>
          {(['chapter', 'page'] as ProgressUnit[]).map((u) => (
            <button
              key={u}
              type='button'
              onClick={() => setUnit(u)}
              className={cn(
                'rounded-[5px] px-2 py-1 text-sm transition-colors',
                unit === u
                  ? 'bg-primary text-parchment'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {UNIT_LABEL[u]}
            </button>
          ))}
        </div>
      </div>

      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>{UNIT_LABEL[unit]} number</span>
        <Input
          type='number'
          min={0}
          value={value}
          disabled={finished}
          onChange={(e) => setValue(e.target.value)}
          placeholder='0'
        />
      </label>

      <button
        type='button'
        onClick={() => setFinished((f) => !f)}
        aria-pressed={finished}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors',
          finished
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border/60 hover:border-primary/50'
        )}
      >
        <span
          className={cn(
            'flex size-4 items-center justify-center rounded-[4px] border',
            finished
              ? 'border-primary bg-primary text-parchment'
              : 'border-border'
          )}
        >
          {finished && <Check className='size-3' />}
        </span>
        Finished the book
      </button>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button size='sm'>
          <BookMarked className='size-4' /> Log my progress
        </Button>
      }
      title='Log my progress'
      description='Update where you are in the book.'
      content={content}
      footer={
        <Button
          onClick={handleSave}
          disabled={saving}
          className='w-full'
        >
          {saving && <Loader2 className='size-4 animate-spin' />}
          Save progress
        </Button>
      }
    />
  );
}
