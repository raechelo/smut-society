import Typography from '@/components/ui/typography';

// Stub — the club challenge UI will live here. Uses the sidebar (deep red) fill.
export function Challenge() {
  return (
    <div className='panel-shadow flex h-full min-h-40 w-full flex-col gap-2 rounded-md bg-sidebar p-md text-sidebar-foreground'>
      <Typography
        variant='h4'
        classNames='!mb-0 text-accent-light'
      >
        Challenge
      </Typography>
      <p className='text-sm text-sidebar-foreground/70'>Coming soon.</p>
    </div>
  );
}
