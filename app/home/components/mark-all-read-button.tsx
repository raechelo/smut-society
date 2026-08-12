'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { markAllNotificationsRead } from '@/lib/actions/home';

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    try {
      await markAllNotificationsRead();
      router.refresh();
    } catch {
      toast.error('Could not update notifications');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={pending}
      className='text-xs font-medium text-primary hover:underline disabled:opacity-50'
    >
      Mark all read
    </button>
  );
}
