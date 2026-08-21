'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/app/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Members' "share this club" affordance: a dialog with the club's stable invite
// link and a copy button. Anyone who opens the link can join (see the invite
// landing page), which is the only way into a private club.
export function ShareClubButton({
  token,
  isPublic,
}: {
  token: string;
  isPublic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Built on the client so it always reflects the current origin.
  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/bookclubs/join/${token}`
      : `/bookclubs/join/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant='solid'>Invite</Button>}
      title='Invite to this club'
      description={
        isPublic
          ? 'Anyone with this link can join the club.'
          : 'Anyone with this link can join — even though the club is private. Share it only with people you want in.'
      }
      content={
        <div className='flex items-center gap-xs'>
          <Input
            value={inviteUrl}
            readOnly
            aria-label='Club invite link'
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            type='button'
            onClick={handleCopy}
            className='shrink-0'
          >
            {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      }
    />
  );
}
