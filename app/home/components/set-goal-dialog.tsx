'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setReadingGoal } from '@/lib/actions/home';

export function SetGoalDialog({ current }: { current: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current ? String(current) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Math.trunc(Number(value));
    if (!n || n < 1) return;
    setSaving(true);
    try {
      await setReadingGoal(n);
      toast.success('Reading goal saved');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(current ? String(current) : '');
      }}
      trigger={
        <Button
          size='icon-sm'
          variant='ghost'
          color='accent'
        >
          <Edit />
        </Button>
      }
      title='Reading goal'
      description='How many books do you want to finish this year?'
      content={
        <form
          className='flex flex-col gap-3'
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            type='number'
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='e.g. 24'
            autoFocus
          />
        </form>
      }
      footer={
        <Button
          onClick={save}
          disabled={saving || !Number(value)}
          className='w-full'
        >
          {saving && <Loader2 className='size-4 animate-spin' />}
          Save goal
        </Button>
      }
    />
  );
}
