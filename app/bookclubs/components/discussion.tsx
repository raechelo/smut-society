import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { getThreads } from '@/lib/actions/discussions';
import Typography from '@/components/ui/typography';
import { Button } from '@/components/ui/button';

export async function Discussion({ clubId }: { clubId: string }) {
  const threads = await getThreads(clubId, 4);
  const href = `/bookclubs/${clubId}/discussions`;

  return (
    <div className='card-gradient card-shadow flex h-full min-h-40 w-full flex-col gap-2 rounded-md border border-accent/40 bg-card/40 p-md'>
      <div className='flex items-center justify-between gap-2'>
        <Typography
          variant='h4'
          classNames='!mb-0 text-primary'
        >
          Discussion
        </Typography>
        <Button
          asChild
          size='icon-sm'
          variant='outline'
          color='accent'
          aria-label='Open discussions'
        >
          <Link href={href}>
            <MessagesSquare className='size-4' />
          </Link>
        </Button>
      </div>

      {threads.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          No threads yet — start the conversation.
        </p>
      ) : (
        <ul className='flex flex-col divide-y divide-border/40'>
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`${href}#thread-${t.id}`}
                className='flex flex-col gap-0.5 py-2 transition-colors hover:text-primary'
              >
                <span className='truncate text-sm font-medium'>{t.title}</span>
                <span className='text-xs text-muted-foreground'>
                  {t.commentCount} {t.commentCount === 1 ? 'reply' : 'replies'}
                  {' · '}
                  {t.authorName ?? 'Someone'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
