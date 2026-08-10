'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { promoteMemberToAdmin } from '@/lib/actions/clubs';

export function PromoteMemberButton({
  clubId,
  memberUserId,
  memberName,
}: {
  clubId: string;
  memberUserId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePromote = async () => {
    setLoading(true);
    try {
      await promoteMemberToAdmin(clubId, memberUserId);
      toast.success(`${memberName} is now an admin`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update member'
      );
      setLoading(false);
    }
  };

  return (
    <Button
      variant='ghost'
      size='xs'
      onClick={handlePromote}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className='size-3 animate-spin' />
      ) : (
        <ShieldPlus className='size-3' />
      )}
      Make admin
    </Button>
  );
}
