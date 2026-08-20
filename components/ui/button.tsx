import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs cursor-pointer font-semibold tracking-widest whitespace-nowrap uppercase transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/20 dark:aria-invalid:border-error/50 dark:aria-invalid:ring-error/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        solid: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'bg-transparent underline underline-offset-4 hover:underline',
      },
      // Actual colors are applied per (variant, color) in compoundVariants.
      color: {
        primary: '',
        accent: '',
        secondary: '',
        warning: '',
        error: '',
      },
      size: {
        default:
          'h-10 gap-1.5 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-9 gap-1 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        lg: 'h-11 gap-1.5 px-8 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        icon: 'size-10',
        'icon-xs': "size-7 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-9',
        'icon-md': 'size-10',
        'icon-lg': 'size-11',
      },
    },
    compoundVariants: [
      {
        variant: 'solid',
        color: 'primary',
        class: 'bg-primary text-primary-foreground hover:bg-primary-dark',
      },
      {
        variant: 'solid',
        color: 'accent',
        class:
          'bg-accent text-accent-foreground hover:bg-accent-light aria-expanded:bg-accent-light',
      },
      {
        variant: 'solid',
        color: 'secondary',
        class:
          'bg-secondary text-secondary-foreground hover:bg-secondary-light aria-expanded:bg-secondary-light',
      },
      {
        variant: 'solid',
        color: 'warning',
        class: 'bg-warning text-parchment hover:bg-warning/90',
      },
      {
        variant: 'solid',
        color: 'error',
        class: 'bg-error text-parchment hover:bg-error/90',
      },
      {
        variant: 'outline',
        color: 'primary',
        class:
          'border-primary text-primary hover:border-accent-dark hover:text-accent-dark aria-expanded:text-primary dark:hover:text-accent-light dark:aria-expanded:text-accent-light dark:hover:border-accent-light',
      },
      {
        variant: 'outline',
        color: 'accent',
        class:
          'border-accent text-accent hover:border-accent-dark hover:bg-accent/10 aria-expanded:text-accent-dark dark:text-accent-light dark:hover:border-accent-light',
      },
      {
        variant: 'outline',
        color: 'secondary',
        class:
          'border-secondary text-secondary hover:bg-secondary/10 dark:text-secondary-foreground',
      },
      {
        variant: 'outline',
        color: 'warning',
        class: 'border-warning text-warning hover:bg-warning/10',
      },
      {
        variant: 'outline',
        color: 'error',
        class: 'border-error text-error hover:bg-error/10',
      },
      {
        variant: 'ghost',
        color: 'primary',
        class:
          'hover:text-foreground aria-expanded:text-foreground dark:hover:text-accent dark:aria-expanded:text-accent',
      },
      {
        variant: 'ghost',
        color: 'accent',
        class: 'text-accent-dark hover:bg-accent/10 dark:text-accent-light',
      },
      {
        variant: 'ghost',
        color: 'secondary',
        class:
          'text-secondary hover:bg-secondary/10 dark:text-secondary-foreground',
      },
      {
        variant: 'ghost',
        color: 'warning',
        class: 'text-warning hover:bg-warning/10',
      },
      {
        variant: 'ghost',
        color: 'error',
        class: 'text-error hover:bg-error/10',
      },
      {
        variant: 'link',
        color: 'primary',
        class: 'text-primary hover:text-primary-dark',
      },
      {
        variant: 'link',
        color: 'accent',
        class: 'text-accent-dark hover:text-accent dark:text-accent-light',
      },
      {
        variant: 'link',
        color: 'secondary',
        class: 'text-secondary hover:text-secondary-light',
      },
      {
        variant: 'link',
        color: 'warning',
        class: 'text-warning hover:text-warning/80',
      },
      {
        variant: 'link',
        color: 'error',
        class: 'text-error hover:text-error/80',
      },
    ],
    defaultVariants: {
      variant: 'solid',
      color: 'primary',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'solid',
  color = 'primary',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-color={color}
      data-size={size}
      className={cn(buttonVariants({ variant, color, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
