'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { leaveClub } from '@/lib/actions/clubs';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

export function LeaveButton({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveClub(clubId);
      toast.success('Left club');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not leave club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant='outline' onClick={handleLeave} disabled={loading}>
      <LogOut /> Leave
    </Button>
  );
}
