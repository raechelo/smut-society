import Typography from '@/components/ui/typography';

// Stub — the discussion thread UI will live here.
export function Discussion() {
  return (
    <div className='card-gradient card-shadow flex h-full min-h-40 w-full flex-col gap-2 rounded-md border border-accent/40 bg-card/40 p-md'>
      <Typography
        variant='h4'
        classNames='!mb-0 text-primary'
      >
        Discussion
      </Typography>
      <p className='text-sm text-muted-foreground'>Coming soon.</p>
    </div>
  );
}
