'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClub } from '@/lib/actions/clubs';
import { toast } from 'sonner';
import { Globe, Lock, Plus } from 'lucide-react';

const LABEL = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export function CreateClubDialog({ trigger }: { trigger?: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // null = no choice yet; visibility is a required, explicit decision.
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && isPublic !== null && !submitting;

  const handleSubmit = async () => {
    if (isPublic === null || !name.trim()) return;
    setSubmitting(true);
    try {
      const { id } = await createClub({ name, description, isPublic });
      toast.success('Club created');
      setOpen(false);
      router.push(`/bookclubs/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create club';
      toast.error(msg === 'Unauthorized' ? 'Sign in to create a club' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) handleSubmit();
      }}
    >
      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>Name</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Spicy Fantasy Book Club'
          autoFocus
        />
      </label>

      <label className='flex flex-col gap-1.5'>
        <span className={LABEL}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder='What is this club about?'
          className='w-full resize-none rounded-md border border-primary bg-transparent p-sm text-sm outline-none transition-colors hover:border-accent-dark focus-visible:border-ring dark:hover:border-accent-light'
        />
      </label>

      <div className='flex flex-col gap-1.5'>
        <span className={LABEL}>Visibility</span>
        <div className='grid grid-cols-2 gap-xs'>
          <Button
            type='button'
            variant={isPublic === true ? 'default' : 'outline'}
            onClick={() => setIsPublic(true)}
          >
            <Globe /> Public
          </Button>
          <Button
            type='button'
            variant={isPublic === false ? 'default' : 'outline'}
            onClick={() => setIsPublic(false)}
          >
            <Lock /> Private
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          {isPublic === true
            ? 'Anyone can find and join this club.'
            : isPublic === false
              ? 'Hidden from Explore; only members can view it.'
              : 'Choose who can find and join.'}
        </p>
      </div>

      <Button type='submit' disabled={!canSubmit}>
        Create club
      </Button>
    </form>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button>
            <Plus /> Create club
          </Button>
        )
      }
      title='Create a book club'
      description='Start a new club and gather your fellow readers.'
      content={content}
    />
  );
}
