import { ClubEvent } from '@/lib/actions/clubs';

// Builds a Google Calendar "template" link that opens a pre-filled event in the user's own Google calendar
const EVENT_DEFAULT_MS = 60 * 60 * 1000;

export function googleCalendarUrl(event: ClubEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + EVENT_DEFAULT_MS);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function shortDate(startsAt: Date): string {
  return new Date(startsAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const days = Math.round(diffMs / 86_400_000);
  const hours = Math.round(diffMs / 3_600_000);
  const mins = Math.round(diffMs / 60_000);
  if (Math.abs(days) >= 1) return rtf.format(days, 'day');
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
  return rtf.format(mins, 'minute');
}
