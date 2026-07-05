import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { cn } from '@/lib/utils';
import { Stamp } from './stamp';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type LibraryCardProps = {
  title: string;
  subtitle: string;
  cadence: 'Daily' | 'Weekly' | 'Book' | 'Series';
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
  variant: 'hero' | 'default';
  color: 'primary' | 'secondary' | 'accent' | 'rust' | 'sienna' | 'sapphire';
};

const COLOR_BG: Record<LibraryCardProps['color'], string> = {
  primary: 'bg-primary/15',
  secondary: 'bg-secondary/15',
  accent: 'bg-accent/20',
  rust: 'bg-rust/20',
  sienna: 'bg-sienna/20',
  sapphire: 'bg-sapphire/20',
};

const COLOR_ICON: Record<LibraryCardProps['color'], string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  rust: 'text-rust',
  sienna: 'text-sienna',
  sapphire: 'text-sapphire',
};

// exact title to link
const links = {
  Bingo: '/challenges/bingo',
  Bookdle: '/challenges/bookdle',
  Quote: '/challenges/quote',
  Polls: '/challenges/polls',
  Spice: '/challenges/spice',
};

export const LibraryCard = ({
  title,
  subtitle,
  cadence,
  Icon,
  description,
  variant,
  color,
}: LibraryCardProps) => {
  const iconBgColor = COLOR_BG[color];
  const iconColor = COLOR_ICON[color];

  return (
    <Card
      className='border-accent-light h-full relative'
      cornerDecoration={variant === 'hero' ? 'all' : undefined}
    >
      <CardContent className='flex gap-md flex-1 w-full items-center'>
        <div className='flex items-center justify-center shrink-0'>
          <div
            className={cn(
              'rounded-full size-[60px]',
              iconBgColor,
              variant === 'hero' && 'size-[110px]'
            )}
          >
            <Icon
              className={cn(
                'h-full m-auto w-[40px]',
                iconColor,
                variant === 'hero' && 'w-[70px]'
              )}
            />
          </div>
        </div>
        <div
          className={cn(
            'flex flex-col gap-sm w-full',
            variant === 'hero' && 'px-sm gap-md'
          )}
        >
          <h3
            className={cn(
              'font-semibold',
              variant === 'hero' ? 'text-2xl' : 'text-lg'
            )}
          >
            {title}
          </h3>
          <Separator className='bg-accent-light/30' />
          <p
            className={cn(
              'italic text-muted-foreground',
              variant === 'hero' ? 'text-base' : 'text-sm'
            )}
          >
            {subtitle}
          </p>
          {description && (
            <>
              <Separator className='bg-accent-light/30' />
              <p
                className={cn(
                  'text-muted-foreground',
                  variant === 'hero' ? 'text-sm leading-relaxed' : 'text-sm'
                )}
              >
                {description}
              </p>
            </>
          )}
        </div>
        <Stamp
          color={color}
          label={cadence}
          className='top-4 right-4 z-10 absolute'
        />
      </CardContent>
      <CardFooter className='justify-end'>
        <Link href={links[title as keyof typeof links]}>
          <Button
            size={variant === 'hero' ? 'lg' : 'default'}
            variant={variant === 'hero' ? 'default' : 'outline'}
          >
            Play
            {variant === 'hero' && <ArrowRight />}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
