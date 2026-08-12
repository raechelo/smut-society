'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { joinClub } from '@/lib/actions/clubs';
import { toast } from 'sonner';
import { Check, Plus } from 'lucide-react';

export function JoinButton({
  clubId,
  joined,
}: {
  clubId: string;
  joined: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (joined) {
    return (
      <Button variant='outline' disabled>
        <Check /> Joined
      </Button>
    );
  }

  const handleJoin = async () => {
    setLoading(true);
    try {
      await joinClub(clubId);
      toast.success('Joined club');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not join club';
      toast.error(msg === 'Unauthorized' ? 'Sign in to join a club' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleJoin} disabled={loading}>
      <Plus /> Join
    </Button>
  );
}
