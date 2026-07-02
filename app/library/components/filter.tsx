import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterIcon, SortAsc } from 'lucide-react';
import React from 'react';

export const Filter = () => {
  return (
    <div className='flex w-full gap-sm'>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            size='icon-md'
          >
            <FilterIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent>filter content here</PopoverContent>
      </Popover>
      <Button
        variant='outline'
        size='icon-md'
      >
        <SortAsc />
      </Button>
      <div className='flex-2'>
        <Input
          type='text'
          placeholder='Search...'
        />
      </div>
      <div className='flex gap-sm'></div>
    </div>
  );
};
