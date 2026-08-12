'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { SmilePlus } from 'lucide-react';
import { toast } from 'sonner';
// Type-only so the picker module stays out of the server bundle (loaded via
// next/dynamic below); Theme's runtime values are just the strings we cast to.
import type { EmojiClickData, Theme } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  toggleCommentReaction,
  toggleThreadReaction,
  type ReactionSummary,
} from '@/lib/actions/discussions';

// emoji-picker-react touches the DOM, so load it client-only.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export function ReactionBar({
  targetType,
  targetId,
  reactions,
  canReact,
}: {
  targetType: 'thread' | 'comment';
  targetId: string;
  reactions: ReactionSummary[];
  canReact: boolean;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const pickerTheme = (resolvedTheme === 'dark'
    ? 'dark'
    : 'light') as unknown as Theme;

  const toggle = async (emoji: string) => {
    if (!canReact) {
      toast.error('Join this club to react');
      return;
    }
    setPending(true);
    try {
      if (targetType === 'thread') {
        await toggleThreadReaction(targetId, emoji);
      } else {
        await toggleCommentReaction(targetId, emoji);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not react');
    } finally {
      setPending(false);
    }
  };

  // Nothing to show and can't add any.
  if (reactions.length === 0 && !canReact) return null;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {reactions.map((r) => (
        <Button
          key={r.emoji}
          type='button'
          size='xs'
          variant={r.reacted ? 'solid' : 'outline'}
          disabled={pending}
          onClick={() => toggle(r.emoji)}
          className='rounded-full'
        >
          <span className='text-sm leading-none'>{r.emoji}</span>
          <span className='tabular-nums'>{r.count}</span>
        </Button>
      ))}

      {canReact && (
        <Popover
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type='button'
              size='icon-xs'
              variant='outline'
              aria-label='Add reaction'
              className='rounded-full'
            >
              <SmilePlus className='size-3.5' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='w-auto border-0 bg-transparent p-0 shadow-none ring-0'
          >
            <EmojiPicker
              onEmojiClick={(d: EmojiClickData) => {
                setOpen(false);
                toggle(d.emoji);
              }}
              theme={pickerTheme}
              lazyLoadEmojis
              width={320}
              height={380}
              previewConfig={{ showPreview: false }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
