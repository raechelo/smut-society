'use client';

import { useState } from 'react';
import { CircleUser } from 'lucide-react';
import { CommentForm } from './comment-form';
import { ReactionBar } from './reaction-bar';
import { Card } from '@/components/ui/card';
import type { ThreadComment, ThreadDetail } from '@/lib/actions/discussions';

const PREVIEW_COUNT = 2;

function formatTime(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CommentRow({
  comment,
  canReact,
}: {
  comment: ThreadComment;
  canReact: boolean;
}) {
  return (
    <div className='flex gap-2.5'>
      {comment.authorImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.authorImage}
          alt={comment.authorName ?? 'Member'}
          className='size-8 shrink-0 rounded-full object-cover'
        />
      ) : (
        <CircleUser className='size-8 shrink-0 text-muted-foreground' />
      )}
      <div className='flex min-w-0 flex-col gap-1.5'>
        <div>
          <div className='flex items-baseline gap-2'>
            <span className='text-sm font-medium'>
              {comment.authorName ?? 'Anonymous'}
            </span>
            <span
              className='text-xs text-muted-foreground'
              suppressHydrationWarning
            >
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <p className='whitespace-pre-wrap text-sm'>{comment.body}</p>
        </div>
        <ReactionBar
          targetType='comment'
          targetId={comment.id}
          reactions={comment.reactions}
          canReact={canReact}
        />
      </div>
    </div>
  );
}

export function ThreadCard({
  thread,
  canPost,
}: {
  thread: ThreadDetail;
  canPost: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded
    ? thread.comments
    : thread.comments.slice(0, PREVIEW_COUNT);
  const hidden = thread.comments.length - shown.length;

  return (
    <Card
      shadow
      id={`thread-${thread.id}`}
      className='scroll-mt-4 gap-3'
    >
      <div className='flex flex-col gap-1'>
        <h3 className='text-base font-semibold text-primary'>{thread.title}</h3>
        <p className='text-xs text-muted-foreground'>
          {thread.authorName ?? 'Someone'} · {formatTime(thread.createdAt)}
        </p>
        {thread.body && (
          <p className='mt-1 whitespace-pre-wrap text-sm'>{thread.body}</p>
        )}
      </div>

      <ReactionBar
        targetType='thread'
        targetId={thread.id}
        reactions={thread.reactions}
        canReact={canPost}
      />

      {thread.comments.length > 0 && (
        <div className='flex flex-col gap-3 border-t border-border/40 pt-3'>
          {shown.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              canReact={canPost}
            />
          ))}
          {hidden > 0 && (
            <button
              type='button'
              onClick={() => setExpanded(true)}
              className='self-start text-xs font-medium text-primary hover:underline'
            >
              View {hidden} more {hidden === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}

      {canPost && (
        <div className='border-t border-border/40 pt-3'>
          <CommentForm threadId={thread.id} />
        </div>
      )}
    </Card>
  );
}
