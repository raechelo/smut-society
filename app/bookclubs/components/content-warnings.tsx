'use client';

import { TriangleAlert } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import Typography from '@/components/ui/typography';

export function ContentWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          color='secondary'
          size='sm'
        >
          <TriangleAlert className='size-4' /> Content warnings
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-64'
      >
        <div className='flex flex-col gap-2'>
          <Typography
            variant='caption'
            color='muted'
          >
            Content warnings
          </Typography>
          <ul className='flex flex-col gap-1.5'>
            {warnings.map((w) => (
              <li
                key={w}
                className='flex items-start gap-2'
              >
                <TriangleAlert className='mt-0.5 size-3.5 shrink-0 text-secondary' />
                <Typography
                  variant='p2'
                  classNames='capitalize'
                >
                  {w}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
