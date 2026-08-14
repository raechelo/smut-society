'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Typography from '@/components/ui/typography';
import {
  updateProgress,
  type ProgressUnit,
  type ReadingProgress,
} from '@/lib/actions/clubs';

const UNIT_LABEL: Record<ProgressUnit, string> = {
  chapter: 'Chapter',
  page: 'Page',
};

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
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          Tracking by
        </Typography>
        <Tabs
          value={unit}
          onValueChange={(v) => setUnit(v as ProgressUnit)}
        >
          <TabsList className='w-full'>
            <TabsTrigger value='chapter'>Chapter</TabsTrigger>
            <TabsTrigger value='page'>Page</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <label className='flex flex-col gap-1.5'>
        <Typography
          variant='caption'
          color='muted'
          classNames='text-xs font-medium'
        >
          {UNIT_LABEL[unit]} number
        </Typography>
        <Input
          type='number'
          min={0}
          value={value}
          disabled={finished}
          onChange={(e) => setValue(e.target.value)}
          placeholder='0'
        />
      </label>

      <Button
        type='button'
        variant={finished ? 'solid' : 'outline'}
        onClick={() => setFinished((f) => !f)}
        aria-pressed={finished}
        className='w-full justify-start'
      >
        <Check className='size-4' />
        Finished the book
      </Button>
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
