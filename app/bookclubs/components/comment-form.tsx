'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { addComment } from '@/lib/actions/discussions';

export function CommentForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await addComment(threadId, body);
      setBody('');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not post your comment'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className='flex items-end gap-2'
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Enter to send, Shift+Enter for a newline.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        placeholder='Add a comment…'
        className='min-h-0 flex-1 resize-none rounded-md border border-primary bg-transparent p-sm text-sm outline-none transition-colors hover:border-accent-dark focus-visible:border-ring dark:hover:border-accent-light'
      />
      <Button
        type='submit'
        size='icon-sm'
        disabled={saving || !body.trim()}
        aria-label='Post comment'
      >
        {saving ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <SendHorizontal className='size-4' />
        )}
      </Button>
    </form>
  );
}
