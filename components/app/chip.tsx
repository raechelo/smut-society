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
        ink: '',
        accent: '',
        sapphire: '',
        sienna: '',
        rust: '',
        warning: '',
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
      { variant: 'outline', colors: 'ink', class: 'border-ink text-ink' },
      { variant: 'filled', colors: 'ink', class: 'bg-ink text-parchment' },
      { variant: 'painted', colors: 'ink', class: 'bg-ink/10 border-ink text-ink' },
      { variant: 'outline', colors: 'accent', class: 'border-accent text-accent' },
      { variant: 'filled', colors: 'accent', class: 'bg-accent text-ink' },
      { variant: 'painted', colors: 'accent', class: 'bg-accent/15 border-accent text-accent' },
      { variant: 'outline', colors: 'sapphire', class: 'border-sapphire text-sapphire' },
      { variant: 'filled', colors: 'sapphire', class: 'bg-sapphire text-parchment' },
      { variant: 'painted', colors: 'sapphire', class: 'bg-sapphire/15 border-sapphire text-sapphire' },
      { variant: 'outline', colors: 'sienna', class: 'border-sienna text-sienna' },
      { variant: 'filled', colors: 'sienna', class: 'bg-sienna text-parchment' },
      { variant: 'painted', colors: 'sienna', class: 'bg-sienna/15 border-sienna text-sienna' },
      { variant: 'outline', colors: 'rust', class: 'border-rust text-rust' },
      { variant: 'filled', colors: 'rust', class: 'bg-rust text-parchment' },
      { variant: 'painted', colors: 'rust', class: 'bg-rust/15 border-rust text-rust' },
      { variant: 'outline', colors: 'warning', class: 'border-warning text-warning' },
      { variant: 'filled', colors: 'warning', class: 'bg-warning text-parchment' },
      { variant: 'painted', colors: 'warning', class: 'bg-warning/15 border-warning text-warning' },
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
  label: string | number;
}

export const Chip = ({ variant, colors, size, label, className, ...props }: ChipProps) => {
  return (
    <div className={cn(chipVariants({ variant, colors, size }), className)} {...props}>
      {label}
    </div>
  );
};
