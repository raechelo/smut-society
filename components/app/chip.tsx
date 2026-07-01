import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center rounded-full font-medium font-noto-sans transition-colors',
  {
    variants: {
      variant: {
        outline: 'bg-transparent border',
        filled: 'border border-transparent',
        painted: 'border',
      },
      colors: {
        primary: '',
        secondary: '',
        wine: '',
      },
      size: {
        default: 'px-3 py-1 text-sm',
        small: 'px-2 py-0.5 text-xs',
      },
    },
    compoundVariants: [
      { variant: 'outline', colors: 'primary', class: 'border-primary text-primary' },
      { variant: 'outline', colors: 'secondary', class: 'border-secondary text-secondary' },
      { variant: 'outline', colors: 'wine', class: 'border-wine text-wine' },
      { variant: 'filled', colors: 'primary', class: 'bg-primary text-parchment' },
      { variant: 'filled', colors: 'secondary', class: 'bg-secondary text-parchment' },
      { variant: 'filled', colors: 'wine', class: 'bg-wine text-parchment' },
      { variant: 'painted', colors: 'primary', class: 'bg-primary/15 border-primary text-primary' },
      { variant: 'painted', colors: 'secondary', class: 'bg-secondary/15 border-secondary text-secondary' },
      { variant: 'painted', colors: 'wine', class: 'bg-wine/15 border-wine text-wine' },
    ],
    defaultVariants: {
      variant: 'outline',
      colors: 'primary',
      size: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  label: string;
}

export const Chip = ({ variant, colors, size, label, className, ...props }: ChipProps) => {
  return (
    <div className={cn(chipVariants({ variant, colors, size }), className)} {...props}>
      {label}
    </div>
  );
};
