import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, MessageSquare } from 'lucide-react';
import type { ComponentType } from 'react';
import { getNotifications } from '@/lib/actions/home';
import Typography from '@/components/ui/typography';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MarkAllReadButton } from './mark-all-read-button';

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  thread_reply: MessageSquare,
  club_event: CalendarDays,
  club_book: BookOpen,
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export async function Notifications() {
  const items = await getNotifications(15);
  const unread = items.filter((i) => !i.isRead).length;

  return (
    <Card
      shadow
      className='w-full gap-3'
      cornerDecoration='top'
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Bell className='size-5 text-primary' />
          <Typography
            variant='h4'
            display
            classNames='!mb-0 text-primary'
          >
            Notifications
          </Typography>
          {unread > 0 && (
            <span className='rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'>
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {items.length === 0 ? (
        <Typography
          variant='p2'
          color='muted'
        >
          You’re all caught up.
        </Typography>
      ) : (
        <ul className='flex flex-col divide-y divide-border/40'>
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const inner = (
              <div className='flex items-start gap-3 py-2.5'>
                <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0 flex-1'>
                  <Typography
                    variant='p2'
                    classNames={cn(!n.isRead && 'font-semibold')}
                  >
                    {n.title}
                  </Typography>
                  {n.body && (
                    <Typography
                      variant='p2'
                      color='muted'
                      classNames='truncate text-xs'
                    >
                      {n.body}
                    </Typography>
                  )}
                </div>
                <span
                  className='shrink-0 text-xs text-muted-foreground'
                  suppressHydrationWarning
                >
                  {timeAgo(n.createdAt)}
                </span>
                {!n.isRead && (
                  <span className='mt-1.5 size-2 shrink-0 rounded-full bg-primary' />
                )}
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link
                    href={n.link}
                    className='block transition-colors hover:text-primary'
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
