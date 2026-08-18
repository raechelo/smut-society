'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Typography from '@/components/ui/typography';
import { createCustomGoal, type GoalUnit } from '@/lib/actions/home';

const UNITS: { value: GoalUnit; label: string }[] = [
  { value: 'books', label: 'Books' },
  { value: 'pages', label: 'Pages' },
  { value: 'hours', label: 'Hours' },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className='flex flex-col gap-1.5'>
      <Typography
        variant='caption'
        color='muted'
        classNames='text-xs font-medium'
      >
        {label}
      </Typography>
      {children}
    </label>
  );
}

export function CreateGoalDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<GoalUnit>('books');
  const [target, setTarget] = useState('');
  const [progress, setProgress] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setUnit('books');
    setTarget('');
    setProgress('');
  };

  const canSave = name.trim().length > 0 && Number(target) >= 1 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await createCustomGoal({
        name,
        unit,
        target: Math.trunc(Number(target)),
        progress: Math.trunc(Number(progress)) || 0,
      });
      toast.success('Goal added');
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add goal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
      trigger={
        <Button
          size='icon'
          aria-label='Add a reading goal'
          className='rounded-full'
        >
          <Plus className='size-5' />
        </Button>
      }
      title='New reading goal'
      description='Set a target to work toward and track your progress.'
      content={
        <form
          className='flex flex-col gap-4'
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label='Name'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Summer smut sprint'
              autoFocus
            />
          </Field>

          <div className='flex gap-3'>
            <div className='flex-1'>
              <Field label='Goal'>
                <Input
                  type='number'
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder='e.g. 12'
                />
              </Field>
            </div>
            <div className='flex-1'>
              <Field label='Measured in'>
                <Select
                  value={unit}
                  onValueChange={(v) => setUnit(v as GoalUnit)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem
                        key={u.value}
                        value={u.value}
                      >
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <Field label='Current progress'>
            <Input
              type='number'
              min={0}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder='0'
            />
          </Field>
        </form>
      }
      footer={
        <Button
          onClick={save}
          disabled={!canSave}
          className='w-full'
        >
          {saving && <Loader2 className='size-4 animate-spin' />}
          Add goal
        </Button>
      }
    />
  );
}
