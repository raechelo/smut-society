import { CircleUser } from 'lucide-react';
import type {
  ClubBook,
  ClubMember,
  ReadingProgress,
} from '@/lib/actions/clubs';
import { getBookMeta } from '@/lib/google-books';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { LogProgressDialog } from './log-progress-dialog';

// A percent for the viewer's bar, or null when it can't be computed
// (chapter-based progress with no known chapter total).
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

// Compact "current/total" shown under each member avatar, e.g. "142/356".
function compactProgress(
  p: ReadingProgress | null,
  totalPages: number | null
): string {
  if (!p) return '—';
  if (p.finished) return totalPages ? `${totalPages}/${totalPages}` : 'Done';
  if (p.unit === 'page') {
    return totalPages ? `${p.value}/${totalPages}` : `p. ${p.value}`;
  }
  return `Ch. ${p.value}`;
}

function MyProgress({
  progress,
  totalPages,
}: {
  progress: ReadingProgress | null;
  totalPages: number | null;
}) {
  const pct = progressPercent(progress, totalPages);

  return (
    <div className='flex flex-col gap-1.5'>
      <span className='self-end text-xs text-muted-foreground'>
        {progressLabel(progress, totalPages)}
      </span>
      <div className='h-2.5 w-full overflow-hidden rounded-full bg-primary/15'>
        <div
          className='h-full rounded-full bg-primary'
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function MemberAvatar({
  member,
  totalPages,
}: {
  member: ClubMember;
  totalPages: number | null;
}) {
  return (
    <div className='flex items-center gap-2'>
      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.name ?? 'Member'}
          className='size-10 shrink-0 rounded-full object-cover'
        />
      ) : (
        <CircleUser className='size-10 shrink-0 text-muted-foreground' />
      )}
      <div className='flex min-w-0 flex-col'>
        <span className='max-w-[140px] truncate text-sm font-medium'>
          {member.name ?? 'Anonymous'}
        </span>
        <span className='text-xs tabular-nums text-muted-foreground'>
          {compactProgress(member.progress, totalPages)}
        </span>
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
    <Card
      shadow
      className='w-full gap-4'
    >
      <div className='flex items-center justify-between gap-md'>
        <Typography
          variant='h4'
          display
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
        <MyProgress
          progress={me.progress}
          totalPages={totalPages}
        />
      )}

      {others.length > 0 && (
        <div className='flex flex-wrap gap-4 border-t border-border/50 pt-4'>
          {others.map((m) => (
            <MemberAvatar
              key={m.id}
              member={m}
              totalPages={totalPages}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
