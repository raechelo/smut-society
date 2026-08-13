import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { getThreads } from '@/lib/actions/discussions';
import Typography from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export async function Discussion({ clubId }: { clubId: string }) {
  const threads = await getThreads(clubId, 4);
  const href = `/bookclubs/${clubId}/discussions`;

  return (
    <Card
      shadow
      className='h-full min-h-40 w-full gap-2'
    >
      <div className='flex items-center justify-between gap-2'>
        <Typography
          variant='h4'
          display
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
        <Typography
          variant='p2'
          color='muted'
        >
          No threads yet — start the conversation.
        </Typography>
      ) : (
        <ul className='flex flex-col divide-y divide-border/40'>
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`${href}#thread-${t.id}`}
                className='flex flex-col gap-0.5 py-2 transition-colors hover:text-primary'
              >
                <Typography
                  variant='p2'
                  classNames='truncate font-medium'
                >
                  {t.title}
                </Typography>
                <Typography
                  variant='span'
                  color='muted'
                >
                  {t.commentCount} {t.commentCount === 1 ? 'reply' : 'replies'}
                  {' · '}
                  {t.authorName ?? 'Someone'}
                </Typography>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
