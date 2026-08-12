import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';

export type NewNotification = {
  userId: string;
  type: 'thread_reply' | 'club_event' | 'club_book';
  title: string;
  body?: string | null;
  link?: string | null;
};

// Insert notifications (no-op on empty). Used by the actions that create the
// underlying events (comments, club events, book picks).
export async function createNotifications(
  rows: NewNotification[]
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(notifications).values(
    rows.map((r) => ({
      userId: r.userId,
      type: r.type,
      title: r.title,
      body: r.body ?? null,
      link: r.link ?? null,
    }))
  );
}
