'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Check, DoorOpen, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { joinClubByToken } from '@/lib/actions/clubs';

// The action on the invite landing page. Signed-out visitors sign in first
// (returning to this same link); members jump straight to the club; everyone
// else accepts the invite and is routed in.
export function InviteActions({
  token,
  clubId,
  signedIn,
  isMember,
}: {
  token: string;
  clubId: string;
  signedIn: boolean;
  isMember: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!signedIn) {
    return (
      <Button
        onClick={() =>
          signIn('google', { callbackUrl: `/bookclubs/join/${token}` })
        }
      >
        <LogIn /> Sign in to join
      </Button>
    );
  }

  if (isMember) {
    return (
      <Button onClick={() => router.push(`/bookclubs/${clubId}`)}>
        <Check /> Go to club
      </Button>
    );
  }

  const handleJoin = async () => {
    setLoading(true);
    try {
      const { clubId: joinedId } = await joinClubByToken(token);
      toast.success('Joined club');
      router.push(`/bookclubs/${joinedId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not join club';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={loading}
    >
      <DoorOpen /> Join club
    </Button>
  );
}
