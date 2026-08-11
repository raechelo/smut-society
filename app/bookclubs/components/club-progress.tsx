import { CircleUser } from 'lucide-react';
import type {
  ClubBook,
  ClubMember,
  ReadingProgress,
} from '@/lib/actions/clubs';
import { getBookMeta } from '@/lib/google-books';
import { cn } from '@/lib/utils';
import Typography from '@/components/ui/typography';
import { LogProgressDialog } from './log-progress-dialog';

// A percent for the bar, or null when it can't be computed (chapter-based
// progress with no known chapter total — we show the label instead).
function progressPercent(
  p: ReadingProgress | null,
  totalPages: number | null
): number | null {
  if (!p) return 0;
  if (p.finished) return 100;
  if (p.unit === 'page' && totalPages) {
    return Math.min(100, Math.max(0, Math.round((p.value / totalPages) * 100)));
  }
  return null;
}

function progressLabel(
  p: ReadingProgress | null,
  totalPages: number | null
): string {
  if (!p) return 'Not started';
  if (p.finished) return 'Finished';
  if (p.unit === 'page') {
    return totalPages ? `Page ${p.value} of ${totalPages}` : `Page ${p.value}`;
  }
  return `Chapter ${p.value}`;
}

function MemberProgressRow({
  member,
  totalPages,
  highlight = false,
}: {
  member: ClubMember;
  totalPages: number | null;
  highlight?: boolean;
}) {
  const pct = progressPercent(member.progress, totalPages);
  const avatarSize = highlight ? 'size-10' : 'size-8';

  return (
    <div className='flex items-center gap-3'>
      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.name ?? 'Member'}
          className={cn('shrink-0 rounded-full object-cover', avatarSize)}
        />
      ) : (
        <CircleUser className={cn('shrink-0 text-muted-foreground', avatarSize)} />
      )}

      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className={cn(
              'truncate text-sm',
              highlight ? 'font-semibold' : 'font-medium'
            )}
          >
            {member.isMe ? 'You' : member.name ?? 'Anonymous'}
          </span>
          <span className='shrink-0 text-xs text-muted-foreground'>
            {progressLabel(member.progress, totalPages)}
          </span>
        </div>

        {pct !== null && (
          <div
            className={cn(
              'mt-1.5 w-full overflow-hidden rounded-full bg-muted',
              highlight ? 'h-2.5' : 'h-1.5'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full',
                highlight ? 'bg-primary' : 'bg-primary/50'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export async function ClubProgress({
  clubId,
  book,
  members,
  isMember,
}: {
  clubId: string;
  book: ClubBook | null;
  members: ClubMember[];
  isMember: boolean;
}) {
  // No current read — nothing to track.
  if (!book) return null;

  const meta = await getBookMeta(book.bookId);
  const totalPages = meta?.pageCount ?? null;

  const me = members.find((m) => m.isMe) ?? null;
  const others = members.filter((m) => !m.isMe);

  return (
    <div className='flex w-full flex-col gap-4 rounded-md border border-accent/40 bg-card/40 p-md'>
      <div className='flex items-center justify-between gap-md'>
        <Typography
          variant='h4'
          classNames='!mb-0 text-primary'
        >
          Club&apos;s Progress
        </Typography>
        {isMember && me && (
          <LogProgressDialog
            clubId={clubId}
            bookId={book.bookId}
            initial={me.progress}
          />
        )}
      </div>

      {me && (
        <MemberProgressRow
          member={me}
          totalPages={totalPages}
          highlight
        />
      )}

      {others.length > 0 && (
        <div className='flex flex-col gap-3 border-t border-border/50 pt-4'>
          {others.map((m) => (
            <MemberProgressRow
              key={m.id}
              member={m}
              totalPages={totalPages}
            />
          ))}
        </div>
      )}
    </div>
  );
}
