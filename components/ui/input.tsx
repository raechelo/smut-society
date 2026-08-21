import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'> & {
  // Optional leading icon rendered inside the field. The input reserves left
  // padding so the placeholder/text never sits under it.
  startIcon?: React.ReactNode;
};

function Input({ className, type, startIcon, ...props }: InputProps) {
  const input = (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'h-10 w-full min-w-0 border border-primary rounded-md bg-transparent py-1 text-base transition-[color,border-color] hover:border-accent-dark dark:hover:border-accent-light outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/45 focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm dark:aria-invalid:border-b-destructive/50',
        // Horizontal padding is kept out of the base string so the icon variant
        // can override the left padding cleanly (tailwind-merge won't dedupe the
        // theme's `pl-sm` against a numeric `pl-*`).
        startIcon ? 'pl-9 pr-sm' : 'pl-sm pr-0',
        className
      )}
      {...props}
    />
  );

  if (!startIcon) return input;

  return (
    <div className='relative w-full'>
      <span className='pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4'>
        {startIcon}
      </span>
      {input}
    </div>
  );
}

export { Input };
