import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

type CardColor = 'primary' | 'secondary' | 'wine' | 'success' | 'error';
type CardVariant = 'outlined' | 'filled' | 'painted';

const cardVariants = cva(
  'group/card flex flex-col rounded-md overflow-hidden text-sm shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow p-md has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none',
  {
    variants: {
      variant: {
        outlined: 'bg-transparent ring-1',
        filled: 'ring-1',
        painted: '',
      },
      color: {
        primary: '',
        secondary: '',
        wine: '',
        success: '',
        error: '',
      },
    },
    compoundVariants: [
      // outlined — colored border, transparent bg, default text
      { variant: 'outlined', color: 'primary', className: 'ring-primary' },
      { variant: 'outlined', color: 'secondary', className: 'ring-secondary' },
      { variant: 'outlined', color: 'wine', className: 'ring-wine' },
      { variant: 'outlined', color: 'success', className: 'ring-success' },
      { variant: 'outlined', color: 'error', className: 'ring-error' },
      // filled — colored border + bg, light text
      {
        variant: 'filled',
        color: 'primary',
        className: 'ring-primary bg-primary/55 text-primary-foreground',
      },
      {
        variant: 'filled',
        color: 'secondary',
        className: 'ring-secondary bg-secondary text-primary-foreground',
      },
      {
        variant: 'filled',
        color: 'wine',
        className: 'ring-wine bg-wine text-primary-foreground',
      },
      {
        variant: 'filled',
        color: 'success',
        className: 'ring-success bg-success text-primary-foreground',
      },
      {
        variant: 'filled',
        color: 'error',
        className: 'ring-error bg-error text-primary-foreground',
      },
      // painted — no border, colored bg, light text
      {
        variant: 'painted',
        color: 'primary',
        className: 'bg-primary text-primary-foreground',
      },
      {
        variant: 'painted',
        color: 'secondary',
        className: 'bg-secondary text-primary-foreground',
      },
      {
        variant: 'painted',
        color: 'wine',
        className: 'bg-wine text-primary-foreground',
      },
      {
        variant: 'painted',
        color: 'success',
        className: 'bg-success text-primary-foreground',
      },
      {
        variant: 'painted',
        color: 'error',
        className: 'bg-error text-primary-foreground',
      },
    ],
    defaultVariants: {
      variant: 'outlined',
      color: 'primary',
    },
  }
);

// Ring color classes for painted hover (outlined/filled already have ring-color set)
const hoverRingColor: Record<CardColor, string> = {
  primary: 'hover:ring-primary',
  secondary: 'hover:ring-secondary',
  wine: 'hover:ring-wine',
  success: 'hover:ring-success',
  error: 'hover:ring-error',
};

function Card({
  className,
  size = 'default',
  variant = 'outlined',
  color = 'primary',
  onClick,
  ...props
}: React.ComponentProps<'div'> & {
  size?: 'default' | 'sm';
  variant?: CardVariant;
  color?: CardColor;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      data-slot='card'
      data-size={size}
      onClick={onClick}
      className={cn(
        cardVariants({ variant, color }),
        onClick &&
          cn(
            'cursor-pointer hover:ring-2',
            variant === 'painted' && hoverRingColor[color]
          ),
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-none has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]',
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
