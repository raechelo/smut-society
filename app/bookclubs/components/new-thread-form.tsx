'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createThread } from '@/lib/actions/discussions';

export function NewThreadForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createThread(clubId, { title, body });
      setTitle('');
      setBody('');
      toast.success('Thread posted');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not start the thread'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className='card-gradient card-shadow flex flex-col gap-3 rounded-md border border-accent/40 bg-card/40 p-md'
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Start a new thread…'
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder='Say more (optional)…'
        className='w-full resize-none rounded-md border border-primary bg-transparent p-sm text-sm outline-none transition-colors hover:border-accent-dark focus-visible:border-ring dark:hover:border-accent-light'
      />
      <div className='flex justify-end'>
        <Button
          type='submit'
          size='sm'
          disabled={!title.trim() || saving}
        >
          {saving ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <Plus className='size-4' />
          )}
          Post thread
        </Button>
      </div>
    </form>
  );
}
