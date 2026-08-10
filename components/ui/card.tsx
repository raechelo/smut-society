import * as React from 'react';

import { cn } from '@/lib/utils';

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type CornerDecoration =
  | CornerPosition
  | 'top'
  | 'bottom'
  | 'all'
  | 'diagonal'
  | 'anti-diagonal';

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
  diagonal: ['top-left', 'bottom-right'],
  'anti-diagonal': ['top-right', 'bottom-left'],
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

// The card's corner flourishes, reusable on any positioned + isolated surface
// (e.g. the dialog). Render inside an element with `relative`/`fixed` and
// `isolate`; `overflow-hidden` clips the flourish to the surface's corners.
function CardCorners({ decoration }: { decoration: CornerDecoration }) {
  return (
    <>
      {cornerGroups[decoration].map((position) => (
        <CardCorner
          key={position}
          position={position}
        />
      ))}
    </>
  );
}

function Card({
  className,
  size = 'default',
  cornerDecoration,
  shadow = false,
  onClick,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm';
  cornerDecoration?: CornerDecoration;
  // Heavy parchment drop shadow. Off by default (flat) — it reads oddly on
  // full-width cards; opt in for cards laid out in a grid.
  shadow?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      data-slot='card'
      data-size={size}
      onClick={onClick}
      className={cn(
        'group/card relative isolate flex flex-col overflow-hidden rounded-md border border-card-border bg-parchment bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(90,42,30,0.22)_100%)] p-md text-sm transition-shadow has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none dark:bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(134,119,169,0.25)_100%)]',
        shadow &&
          'shadow-[0_6px_28px_rgba(80,34,24,0.3),inset_0_1px_0_rgba(255,248,235,0.85)] dark:shadow-[0_8px_36px_rgba(134,119,169,0.25),inset_0_1px_0_rgba(191,197,211,0.09)]',
        onClick && 'cursor-pointer',
        shadow &&
          onClick &&
          'hover:shadow-[0_6px_28px_rgba(80,34,24,0.33)] dark:hover:shadow-[0_6px_28px_rgba(191,197,211,0.2)]',
        className
      )}
      {...props}
    >
      {children}
      {cornerDecoration && <CardCorners decoration={cornerDecoration} />}
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
        'font-heading text-lg font-semibold tracking-wider',
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
  CardCorners,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
