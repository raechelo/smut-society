'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
    <Button
      type='button'
      variant='link'
      onClick={onClick}
      disabled={pending}
      className='h-auto p-0'
    >
      Mark all read
    </Button>
  );
}
