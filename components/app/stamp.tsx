import { cn } from '@/lib/utils';
import React from 'react';

type ColorOption =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'rust'
  | 'sienna'
  | 'sapphire';

const colorStyles: Record<ColorOption, string> = {
  primary: 'border-primary text-primary',
  secondary: 'border-secondary text-secondary',
  accent: 'border-accent text-accent',
  rust: 'border-rust text-rust',
  sienna: 'border-sienna text-sienna',
  sapphire: 'border-sapphire text-sapphire',
};

export const Stamp = ({
  label,
  topLabel,
  color,
  className,
}: {
  label: string;
  // Optional extra-small line printed above the main label (e.g. "Updated").
  topLabel?: string;
  color: ColorOption;
  className?: string;
}) => {
  return (
    <>
      <svg
        width='0'
        height='0'
        className='absolute overflow-hidden'
      >
        <defs>
          <filter id='rubber-stamp'>
            <feTurbulence
              type='fractalNoise'
              baseFrequency='0.035'
              numOctaves='4'
              result='noise'
            />
            <feDisplacementMap
              in='SourceGraphic'
              in2='noise'
              scale='3'
              xChannelSelector='R'
              yChannelSelector='G'
            />
          </filter>
        </defs>
      </svg>
      <div
        className={cn('rotate-[355deg] inline-block', className)}
        style={{ filter: 'url(#rubber-stamp)' }}
      >
        <div
          className={cn(
            'border-[3px] px-4 py-1.5 uppercase font-black tracking-[0.2em] text-sm',
            colorStyles[color]
          )}
        >
          {topLabel ? (
            <span className='flex flex-col items-center leading-none'>
              <span className='text-[0.5rem] font-bold tracking-[0.15em]'>
                {topLabel}
              </span>
              <span>{label}</span>
            </span>
          ) : (
            label
          )}
        </div>
      </div>
    </>
  );
};
