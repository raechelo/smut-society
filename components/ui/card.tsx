import * as React from 'react';

import { cn } from '@/lib/utils';

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type CornerDecoration = CornerPosition | 'top' | 'bottom' | 'all';

// Each corner is positioned in place and mirrored from the image's native
// (bottom-left) orientation so the flourish always hugs the correct corner.
const cornerClasses: Record<CornerPosition, string> = {
  'bottom-left': 'bottom-0 left-0',
  'bottom-right': 'bottom-0 right-0 -scale-x-100',
  'top-left': 'top-0 left-0 -scale-y-100',
  'top-right': 'top-0 right-0 rotate-180',
};

// Expands a decoration value into the corner positions it renders.
const cornerGroups: Record<CornerDecoration, CornerPosition[]> = {
  'top-left': ['top-left'],
  'top-right': ['top-right'],
  'bottom-left': ['bottom-left'],
  'bottom-right': ['bottom-right'],
  top: ['top-left', 'top-right'],
  bottom: ['bottom-left', 'bottom-right'],
  all: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
};

function CardCorner({ position }: { position: CornerPosition }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute -z-10 block',
        cornerClasses[position]
      )}
    >
      <img
        src='/card-corner.png'
        alt=''
        className='size-16 object-contain opacity-80 dark:invert'
      />
    </span>
  );
}

function Card({
  className,
  size = 'default',
  cornerDecoration,
  onClick,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm';
  cornerDecoration?: CornerDecoration;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  const corners = cornerDecoration ? cornerGroups[cornerDecoration] : [];

  return (
    <div
      data-slot='card'
      data-size={size}
      onClick={onClick}
      className={cn(
        'group/card relative isolate flex flex-col overflow-hidden rounded-md border border-card-border bg-parchment bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(90,42,30,0.13)_100%)] p-md text-sm shadow-[0_4px_20px_rgba(80,34,24,0.25)] transition-shadow has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none dark:bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(134,119,169,0.1)_100%)] dark:shadow-[0_4px_20px_rgba(191,197,211,0.13)]',
        onClick &&
          'cursor-pointer hover:shadow-[0_6px_28px_rgba(80,34,24,0.33)] dark:hover:shadow-[0_6px_28px_rgba(191,197,211,0.2)]',
        className
      )}
      {...props}
    >
      {children}
      {corners.map((position) => (
        <CardCorner
          key={position}
          position={position}
        />
      ))}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min text-center gap-1.5 rounded-none has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn(
        'font-heading text-lg font-semibold tracking-wider uppercase',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn('text-sm leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-content'
      className={cn('pt-sm', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
